import { createSelector } from "reselect";


/**
 * Graph layout constants.
 * -----------------------
 */
const kDataNodeHeight = 25;
const kDataNodeWidth = 25;
const kOpNodeHeight = 40;
const kOpNodeWidth = 80;
const kCollapsedAbstractiveHeight = 40;
const kCollapsedAbstractiveWidth = 80;
const kEdgeMargin = 10;
const kContainerPadding = 30;
const kNodeMargin = 40;
const kTemporalContainerMargin = 40;
const kEdgeThickness = 2.5;
const kCurvePointFactor = 0.1;

/**
 * Creates a "node object" which can be translated into a node in the ELK graph; data, ops, and container nodes are
 * represented as node objects.
 *
 * @param nodeId
 *     Unique identifier for the node object.
 * @param symbolId
 *     Id of the symbol represented by the node. Note that two node objects may share a symbol id, as GraphData
 *     which are used in multiple timesteps have a node created in each temporal container.
 * @param symbolInfo
 *     The symbol's entry in the symbol table.
 * @param container
 *     The node id of the node's container.
 * @param outPorts
 *     The number of output ports the node has; typically modified after node object creation. For example, an op
 *     node might be created before all of its outputs have been explored in the graph, meaning that `outPorts`
 *     cannot be set until after the whole graph is created.
 * @param height
 *     How many layers are nested within the node. 0 for ops and data.
 * @param contents
 *     A list of all node ids contained by the node.
 * @param containsTemporal
 *     Whether the node contains any temporal containers; needed for proper orientation of contents in the ELK graph.
 * @param isTemporal
 *     Whether the node is a temporal container.
 */
function createNodeObj(nodeId, symbolId, symbolTable, container, outPorts=[], height=0, contents=[], temporalStep=-1, containsTemporal=false) {
    if (container === null) {
        container = 'root';
    }
    return {
        viewerObj: getViewerObj(symbolId, symbolTable),
        type: symbolTable[symbolId].type,
        symbolId,
        nodeId,
        container,
        outermost: container === 'root',
        inPorts: 0,
        outPorts,
        contents,
        height,
        containsTemporal,
        orientation: containsTemporal ? "RIGHT" : "UP",
        isTemporal: temporalStep >= 0,
        temporalStep,
    };
}

/**
 * Getter methods
 */
const getViewerObj = (symbolId, symbolTable) => ({
    symbolId,
    type: symbolTable[symbolId].type,
    name: symbolTable[symbolId].name,
    str: symbolTable[symbolId].str,
    payload: symbolTable[symbolId].data.viewer,
});
const getCreatorOp = (dataSymbolId, symbolTable) => symbolTable[dataSymbolId].data.viewer.creatorop;
const getCreatorPos = (dataSymbolId, symbolTable) => symbolTable[dataSymbolId].data.viewer.creatorpos;
const getArgs = (opSymbolId, symbolTable) => symbolTable[opSymbolId].data.viewer.args;
const getKwargs = (opSymbolId, symbolTable) => Object.entries(symbolTable[opSymbolId].data.viewer.kwargs);
const getContainerSymbolId = (symbolId, symbolTable) => symbolTable[symbolId].data.viewer.container;
const getContents = (containerSymbolId, symbolTable) => symbolTable[containerSymbolId].data.viewer.contents;
const getContainerHeight = (containerSymbolId, symbolTable) => symbolTable[containerSymbolId].data.viewer.height;
const getSymbolTemporalStep = (symbolId, symbolTable) => symbolTable[symbolId].data.viewer.temporalstep;
const getSymbolIsTemporal = (symbolId, symbolTable) => symbolTable[symbolId].data.viewer.temporalstep >= 0;
const getNodeIsTemporal = (nodeObj) => nodeObj.isTemporal;
const getPortIdIsInput = (portId) => portId.endsWith('i');
const getIdIsPort = (id) => id.split('_').length > 1;
const getFirstTemporalContainerSymbolId = (symbolId, symbolTable) => {
    let containerId = getContainerSymbolId(symbolId, symbolTable);
    while (containerId !== null && !getSymbolIsTemporal(containerId, symbolTable)) {
        containerId = getContainerSymbolId(containerId, symbolTable);
    }
    return containerId;
};

/**
 * Id translation helper methods.
 * A symbol id is the id associated with a particular object in the Python program. A node id uniquely identifies a node
 * in the graph, and is of the form
 *      {nodeNum}{symbolId}
 * where `nodeNum` indicates how many nodes representing that symbol already exist. A port id uniquely identifies an
 * input or output port on a node, and is of the form
 *      {nodeId}_{portNum}{portType}
 * where `portNum` is the zero-indexed ordering of the port relative to other ports on the node, and `portType` is "i"
 * if the port is an input port and "o" if it is an output port. Note that ELK ids must be globally unique, so ports
 * even on different nodes cannot share ids.
 */
const portIdToSymbolId = (nodeId) => ('\@id:' + nodeId.split('\@id:')[1]).split('_')[0];
const symbolIdToNodeId = (symbolId, nodeNum=0) => symbolId === null ? 'root' : `${nodeNum}${symbolId}`;
const portIdToNodeId = (portId) => portId.indexOf('_') >= 0 ? portId.split('_')[0] : portId;
const nodeIdToPortId = (nodeId, portNum, isInput=false) => `${nodeId}_${portNum}` + (isInput ? 'i' : 'o');
const portIdToPortNum = (portId) => parseInt(portId.split('_')[1]);

/**
 * Builds the graph, creating node objects for each op, container, and leaf data encountered. An array of op-op and
 * data-op edges is also created.
 * @param headSymbolId: the symbol id of the data object at the head of the graph.
 * @param symbolTable: the mapping of symbol ids to their properties taken directly from the Redux state
 * @returns {{nodes: {nodeId: 'nodeObject'}, edges: [['fromNodeId', 'fromPortNum', 'toNodeId']}}
 */
function getNodesAndUnslicedEdges(headSymbolId, symbolTable) {
    let nodes = {};
    let edges = [];
    let opsToCheck = [];
    // Maps the symbol ids of leaf data nodes to an array of container symbol ids that the node should be placed in
    let dataLeafContainers = {};
    let opOutputs = {};
    let checkedOps = new Set();
    if (getCreatorOp(headSymbolId, symbolTable)) {
        // Add info for the head data node, since we iterate over ops
        edges.push([symbolIdToNodeId(getCreatorOp(headSymbolId, symbolTable)),
            getCreatorPos(headSymbolId, symbolTable),
            symbolIdToNodeId(headSymbolId),
            getViewerObj(headSymbolId, symbolTable),
            '']);
        opsToCheck.push(getCreatorOp(headSymbolId, symbolTable));
        dataLeafContainers[headSymbolId] = getFirstTemporalContainerSymbolId(getCreatorOp(headSymbolId, symbolTable), symbolTable);
        opOutputs[symbolIdToNodeId(getCreatorOp(headSymbolId, symbolTable))] = new Set([headSymbolId]);
    }
    else {
        dataLeafContainers[headSymbolId] = null;
    }
    while (opsToCheck.length > 0) {
        let opSymbolId = opsToCheck.pop();
        if (checkedOps.has(opSymbolId) || opSymbolId === null) {
            continue;
        }
        checkedOps.add(opSymbolId);
        // Assume ops can appear exactly once in the graph
        nodes[symbolIdToNodeId(opSymbolId)] = createNodeObj(
            symbolIdToNodeId(opSymbolId),
            opSymbolId,
            symbolTable,
            symbolIdToNodeId(getContainerSymbolId(opSymbolId, symbolTable))
        );
        nodes = {
            ...nodes,
            ...getContainerNodes(opSymbolId, symbolTable),
        };
        let args = getArgs(opSymbolId, symbolTable).concat(getKwargs(opSymbolId, symbolTable));
        args.forEach(([argName, arg]) => {
            if (Array.isArray(arg)) {
                arg.forEach(dataSymbolId => {
                    doStuff(dataSymbolId, argName, opsToCheck, symbolTable, opOutputs, edges, opSymbolId, dataLeafContainers);
                })
            }
            else {
                doStuff(arg, argName, opsToCheck, symbolTable, opOutputs, edges, opSymbolId, dataLeafContainers);
            }
        });
        // We don't assign input ports here, so args may be out of order. Since we moved temporal inputs to the side,
        // though, we can't possibly have order anyway.
        // getArgs(opSymbolId, symbolTable)
        //     .concat(kwargs.map(([key, value]) => value))
        //     .forEach((dataSymbolId, i) => {
        //
        //     });
    }

    // Set the `outPorts` field of each op node object, now that we know how many outputs they will have.
    Object.entries(opOutputs).forEach(([opNodeId, outputs]) => {
        outputs.forEach(dataSymbolId => {
            nodes[opNodeId].outPorts.push(dataSymbolId);
        });
    });

    // Add data nodes, placed in the proper containers.
    Object.entries(dataLeafContainers).forEach(([dataSymbolId, containerSymbolId]) => {
        let containerNodeId = symbolIdToNodeId(containerSymbolId);
        let dataNodeId = symbolIdToNodeId(dataSymbolId);
        nodes[dataNodeId] = createNodeObj(
            dataNodeId,
            dataSymbolId,
            symbolTable,
            containerNodeId,
            dataSymbolId === headSymbolId ? [] : [dataSymbolId]);
        if (containerNodeId !== 'root') {
            // `contents` is immutable since it is derived from the symbol table, so we have to operate on it like this
            nodes[containerNodeId].contents = nodes[containerNodeId].contents.concat([dataNodeId]);
        }
    });
    return { nodes, edges }
}

function doStuff(dataSymbolId, argName, opsToCheck, symbolTable, opOutputs, edges, opSymbolId, dataLeafContainers) {
    if (!dataSymbolId) {
        return;
    }
    // we don't need an input port since two things won't go into the same input
    if (getCreatorOp(dataSymbolId, symbolTable)) {
        opsToCheck.push(getCreatorOp(dataSymbolId, symbolTable));
        let creatorOpNodeId = symbolIdToNodeId(getCreatorOp(dataSymbolId, symbolTable));
        if (!(creatorOpNodeId in opOutputs)) {
            opOutputs[creatorOpNodeId] = [];
        }
        if (opOutputs[creatorOpNodeId].indexOf(dataSymbolId) < 0){
            opOutputs[creatorOpNodeId].push(dataSymbolId);
        }
        edges.push([creatorOpNodeId, getCreatorPos(dataSymbolId, symbolTable), symbolIdToNodeId(opSymbolId), getViewerObj(dataSymbolId, symbolTable), argName]);
    }
    else {
        let firstTemporalSymbolId = getFirstTemporalContainerSymbolId(opSymbolId, symbolTable);
        if (!(dataSymbolId in dataLeafContainers) ||
            getSymbolTemporalStep(dataLeafContainers[dataSymbolId], symbolTable) > getSymbolTemporalStep(firstTemporalSymbolId, symbolTable)) {
            dataLeafContainers[dataSymbolId] = firstTemporalSymbolId;
        }
        // Data nodes only have one output port, so use 0 every time
        edges.push([symbolIdToNodeId(dataSymbolId), 0, symbolIdToNodeId(opSymbolId), getViewerObj(dataSymbolId, symbolTable), argName]);
    }
}

/**
 * Creates node objects for every container in the hierarchy rooted at `symbolId`.
 * @param symbolId: the id of a symbol whose parent containers should be found
 * @param symbolTable: symbol table from the Redux store mapping symbol ids to properties
 */
function getContainerNodes(symbolId, symbolTable) {
    let containerNodes = {};
    let containerId = getContainerSymbolId(symbolId, symbolTable);
    while (containerId !== null) {
        containerNodes[symbolIdToNodeId(containerId)] = createNodeObj(
            symbolIdToNodeId(containerId),
            containerId,
            symbolTable,
            symbolIdToNodeId(getContainerSymbolId(containerId, symbolTable)),
            [],
            getContainerHeight(containerId, symbolTable),
            getContents(containerId, symbolTable).map(opSymbolId => symbolIdToNodeId(opSymbolId)),
            getSymbolTemporalStep(containerId, symbolTable),
            getSymbolIsTemporal(getContents(containerId, symbolTable)[0], symbolTable));
        containerId = getContainerSymbolId(containerId, symbolTable);
    }
    return containerNodes;
}

/**
 * Returns the node id of the first node whose descendants is or includes both nodes. This can return `nodeId1` or
 * `nodeId2` if one node is a descendant of the other.
 * @param nodeId1
 * @param nodeId2
 * @param nodes: mapping of node id: node object.
 */
function getCommonNodeParent(nodeId1, nodeId2, nodes) {
    while (nodeId1 !== nodeId2) {
        if (nodeId1 === 'root' || nodeId2 !== 'root' && nodes[nodeId1].height > nodes[nodeId2].height) {
            nodeId2 = nodes[nodeId2].container;
        }
        else if (nodeId2 === 'root' || nodes[nodeId1].height < nodes[nodeId2].height) {
            nodeId1 = nodes[nodeId1].container;
        }
        else{
            nodeId1 = nodes[nodeId1].container;
            nodeId2 = nodes[nodeId2].container;
        }
    }
    return nodeId1;
}

const symbolIdFromPortId = (portId, nodes) => nodes[portIdToNodeId(portId)].outPorts[portIdToPortNum(portId)];
const portNumFromSymbolId = (nodeId, symbolId, nodes) => nodes[nodeId].outPorts.indexOf(symbolId);

function getSourceHierarchy(portId, nodes) {
    let hierarchy = [];
    const portSymbolId = symbolIdFromPortId(portId, nodes);
    let nodeId = portIdToNodeId(portId);
    while (true) {
        hierarchy.push(portId);
        nodeId = nodes[nodeId].container;
        if (nodeId === 'root') {
            break;
        }
        portId = nodeIdToPortId(nodeId, portNumFromSymbolId(nodeId, portSymbolId, nodes));
    }
    return hierarchy.reverse();
}

function getTargetHierarchy(portId, nodes) {
    let hierarchy = [];
    let nodeId = portIdToNodeId(portId);
    while (nodeId !== 'root') {
        hierarchy.push(nodeId);
        nodeId = nodes[nodeId].container;
    }
    return hierarchy.reverse();
}


/**
 * Creates arrays of ELK edge objects and associates them with the node id of the ELK node which should contain them.
 * @param nodes: mapping of node ids to node objects
 * @param edges: array of edges of the form `[fromPortId, toPortId, metadata]`. `fromPortId` must be an actual port, but
 *               `toPortId` may be either a port or a node
 */
function assignEdgeParents(nodes, edges) {
    let edgeParents = {'root': [], 'temporal': []};
    // to could be a port or a node id, depending on whether or not its a temporal slice
    edges.forEach(([fromPortId, toPortId, metadata]) => {
        if (metadata.isTemporalEdge) {
            edgeParents['temporal'].push({id: fromPortId + toPortId, sourceHierarchy: getSourceHierarchy(fromPortId, nodes), targetHierarchy: getTargetHierarchy(toPortId, nodes), metadata});
            return;
        }
        let commonParent = getCommonNodeParent(portIdToNodeId(fromPortId), portIdToNodeId(toPortId), nodes);
        if (!(commonParent in edgeParents)) {
            edgeParents[commonParent] = [];
        }
        edgeParents[commonParent].push({id: fromPortId + toPortId, sources: [fromPortId], targets: [toPortId], metadata});
    });
    return edgeParents;
}

/**
 * Recursively builds ELK graph nodes for a given node object and its children. Each ELK node contains a field
 * `viewerObj` which contains all of the values which should be passed to the component that renders the node. Nodes
 * also contain a `temporal` field which indicates whether the node is a temporal container.
 * @param nodeId
 * @param nodes: mapping of node id: node object
 * @param edges: mapping of node id to array of edges that should be included in that ELK node
 * @param graphState: mapping of symbol ids to properties about the graph, including whether the node should be
 *                    expanded. Note that this might lead to problems down the road, since there can be multiple nodes
 *                    of the same symbol id. For now, this only applies to data nodes, which cannot be expanded or
 *                    collapsed, so it's not an issue.
 */
function createElkNode(nodeId, nodes, edges, graphState) {
    let nodeObj = nodes[nodeId];
    let expanded = graphState[nodeObj.symbolId].expanded || nodeObj.type !== 'graphcontainer' || getNodeIsTemporal(nodeObj);
    let elkNode = {
        id: nodeObj.nodeId,
        properties: {
            'elk.direction': nodeObj.orientation,
            // We fix the positions of ports on temporal nodes so that we can ensure they go in the right direction
            'portConstraints': getNodeIsTemporal(nodeObj) ? 'FIXED_POS' : 'FIXED_SIDE',
            'elk.layered.spacing.nodeNodeBetweenLayers': kNodeMargin,
            'elk.spacing.nodeNode': kNodeMargin
        },
        containerHeight: nodeObj.height,
        viewerObj: nodeObj.viewerObj,
        temporalStep: nodeObj.temporalStep,
        zOrder: nodeObj.height === 0 || !expanded ? 1 : -nodeObj.height,
        edges: [],
        children: [],
        ports: [],
    };
    if (expanded) {
        // Trying to map over nodeObj.contents leads to unexpected behavior; TODO look into this
        for (let i=0; i < nodeObj.contents.length; i++) {
            let childNodeId = nodeObj.contents[i];
            // not all of a container's contents have to be in the graph
            if (childNodeId in nodes) {
                elkNode.children.push(createElkNode(childNodeId, nodes, edges, graphState));
            }
        }
    }
    for (let i=0; i < nodeObj.inPorts; i++) {
        let newPort = {
            id: nodeIdToPortId(nodeObj.nodeId, i, true),
            properties: {
                'port.side': getNodeIsTemporal(nodeObj) ? "WEST" : "SOUTH",
            }
        };
        // On the initial graph construction, we lock all temporal ports to the top of the container. This forces the
        // first layout to put temporal containers in the proper order and lay out nodes to accomodate these
        // cross-temporal edges. We then move the ports to go directly to their destination and lay the graph out again.
        if (getNodeIsTemporal(nodeObj)) {
            newPort.y = 0;
        }
        elkNode.ports.push(newPort);
    }
    nodeObj.outPorts.forEach((dataSymbolId, i) => {
        let newPort = {
            id: nodeIdToPortId(nodeObj.nodeId, i, false),
            properties: {
                'port.side': getNodeIsTemporal(nodeObj) ? "EAST": "NORTH",
            }
        };
        if (getNodeIsTemporal(nodeObj)) {
            newPort.y = 0;
        }
        elkNode.ports.push(newPort);
    });
    if (nodeObj.type === 'graphcontainer') {
        if (expanded) {
            if (nodeObj.nodeId in edges) {
                elkNode.edges = edges[nodeObj.nodeId];
            }
        }
        else {
            elkNode.height = kCollapsedAbstractiveHeight;
            elkNode.width = kCollapsedAbstractiveWidth;
        }
    }
    else if (nodeObj.type === 'graphop') {
        elkNode.height = kOpNodeHeight;
        elkNode.width = kOpNodeWidth;
    }
    else if (nodeObj.type === 'graphdata') {
        elkNode.height = kDataNodeHeight;
        elkNode.width = kDataNodeWidth;
    }
    return elkNode;
}

const getRootContainsTemporal = (nodes) => {
    let outermost = Object.entries(nodes).filter(([nodeId, nodeObj]) => nodeObj.outermost);
    return outermost.length > 0 && outermost[0][1].temporalStep >= 0;
};

/**
 * Builds the ELK graph to be laid out.
 * @param nodes: mapping of node ids to node objects
 * @param edges: mapping of node id to array of edges which should be given to that node in the ELK graph
 * @param graphState: mapping of symbol ids to properties about the graph
 */
function getElkGraph(nodes, edges, graphState) {
    let rootChildren = Object.entries(nodes).filter(([nodeId, nodeObj]) => nodeObj.outermost).map(([nodeId]) => createElkNode(nodeId, nodes, edges, graphState));
    let orientation = rootChildren.length > 0 && rootChildren[0].temporalStep >= 0 ? 'RIGHT' : 'UP';
    return {
        id: 'root',
        properties: {'elk.algorithm': 'layered',
            'elk.direction': orientation,
            'elk.layered.spacing.nodeNodeBetweenLayers': kNodeMargin,
            'elk.spacing.nodeNode': kNodeMargin
        },
        children: rootChildren,
        edges: edges['root'],
        temporalEdges: edges['temporal'],
    }
}

/**
 * Create a new edge which connects a node's input port to  a new input port on its parent container.
 * @param toNode: node object
 * @param toContainer: node object
 * @param metadata: object containing non-ELK properties of the edge
 */
function linkInputs(toNode, toContainer, metadata) {
    let newEdge = [
        nodeIdToPortId(toContainer.nodeId, toContainer.inPorts, true),
        nodeIdToPortId(toNode.nodeId, toNode.inPorts, true),
        metadata
    ];
    if (!metadata.isTemporalEdge) {
        toNode.inPorts += 1;
    }
    return {newEdge, toNodeId: toContainer.nodeId, toContainerNodeId: toContainer.container}
}

/**
 * Create a new edge which connects a node's output port at port `fromPortNum` to a new output port on its parent
 * container.
 * @param fromNode: node object
 * @param fromPortNum: number identifying the port on `fromNode`
 * @param fromContainer: node object
 * @param metadata: object containing non-ELK properties of the edge
 */
function linkOutputs(fromNode, fromPortNum, fromContainer, metadata) {
    let edgeDataSymbolId = metadata.edgeDataViewerObj.symbolId;
    if (fromContainer.outPorts.indexOf(edgeDataSymbolId) >= 0) {
        let newEdge = [
            nodeIdToPortId(fromNode.nodeId, fromPortNum),
            nodeIdToPortId(fromContainer.nodeId, fromContainer.outPorts.indexOf(edgeDataSymbolId)),
            metadata
        ];
        return {newEdge, fromPortNum: fromContainer.outPorts.indexOf(edgeDataSymbolId), fromNodeId: fromContainer.nodeId, fromContainerNodeId: fromContainer.container};
    }
    else {
        let newEdge = [
            nodeIdToPortId(fromNode.nodeId, fromPortNum),
            nodeIdToPortId(fromContainer.nodeId,fromContainer.outPorts.length),
            metadata
        ];
        fromContainer.outPorts.push(edgeDataSymbolId);
        return {newEdge, fromPortNum: fromContainer.outPorts.length - 1, fromNodeId: fromContainer.nodeId, fromContainerNodeId: fromContainer.container};
    }
}

/**
 * Converts edges which connect ops to ops and ops to data nodes into sub-edges bridging each container boundary in
 * between. ELK can only create edges between nodes when one is the child of the other or if they share an immediate
 * parent.
 * @param nodes: mapping of node ids to node objects
 * @param unslicedEdges: array of edges of the form `[fromNodeId, fromPortNum, toNodeId]`.
 * @returns ([['fromPortId', 'toPortId', {...edge metadata}]])
 */
function sliceEdges(nodes, unslicedEdges) {
    let slicedEdges = [];
    unslicedEdges.forEach((edge, joinedEdgeId) => {
        let [fromNodeId, fromPortNum, toNodeId, edgeDataViewerObj, edgeName] = edge;
        let fromContainerNodeId = nodes[fromNodeId].container;
        let toContainerNodeId = nodes[toNodeId].container;
        // In the case of edges which cross temporal containers, we make our own edges after laying out instead of using
        // the new "to edge" slices. This allows us to maintain port alignment and prevent ELK's ugly attempts at making
        // these edges work.
        let toEdgeSlices = [];
        let fromEdgeSlices = [];
        let joinedEdgeOrder = 0;
        let sharedParent = getCommonNodeParent(fromNodeId, toNodeId, nodes);
        let isTemporalEdge = (sharedParent  === 'root' && getRootContainsTemporal(nodes)) || (sharedParent !== 'root' && nodes[sharedParent].containsTemporal);
        // if (isTemporalEdge) {
        //     while (fromContainerNodeId !== 'root') {
        //         ({fromPortNum, fromNodeId, fromContainerNodeId} = linkOutputs(nodes[fromNodeId], fromPortNum, nodes[fromContainerNodeId], {edgeDataSymbolId}));
        //     }
        //     return;
        // }
        while (true) {
            const metadata = {
                joinedEdgeId,
                joinedEdgeOrder,
                edgeDataViewerObj,
                edgeName,
                isTemporalEdge,
                zOrder: 0,
            };
            if (toContainerNodeId === fromContainerNodeId) {
                let finalEdge = [
                    nodeIdToPortId(fromNodeId, fromPortNum),
                    nodeIdToPortId(toNodeId, nodes[toNodeId].inPorts, true),
                    Object.assign({}, metadata),
                ];
                fromEdgeSlices.push(finalEdge);
                joinedEdgeOrder += 1;
                // If the edge bridges two temporal containers, then we don't actually return `toEdgeSlices`. Instead,
                // we will create a new, prettier edge after the graph has been laid out, since ELK doesn't handle
                // the right-oriented cross-temporal edges well.
                if (isTemporalEdge) {
                    slicedEdges.push([nodeIdToPortId(edge[0], edge[1]), edge[2], {joinedEdgeOrder, joinedEdgeId, isTemporalEdge, edgeDataViewerObj, zOrder: 0, edgeName}]);
                    break;
                    // finalEdge[2].routeToTerminal = [toNodeId].concat(toEdgeSlices.reverse().map(([fromPortId, toPortId]) => toPortId));
                    // slicedEdges = slicedEdges.concat(fromEdgeSlices);
                }
                else{
                    toEdgeSlices.reverse().forEach(edgeSlice => {
                       edgeSlice[2].joinedEdgeOrder = joinedEdgeOrder;
                       joinedEdgeOrder += 1;
                    });
                    slicedEdges = slicedEdges.concat(toEdgeSlices).concat(fromEdgeSlices);
                    nodes[toNodeId].inPorts += 1;
                    break;
                }
            }
            if (fromContainerNodeId === 'root' || toContainerNodeId !== 'root' && nodes[fromContainerNodeId].height > nodes[toContainerNodeId].height) {
                let newEdge = null;
                ({ newEdge, toNodeId, toContainerNodeId } = linkInputs(nodes[toNodeId], nodes[toContainerNodeId], Object.assign({}, metadata)));
                toEdgeSlices.push(newEdge);
                continue;
            }
            if (toContainerNodeId === 'root' || nodes[toContainerNodeId].height > nodes[fromContainerNodeId].height) {
                let newEdge = null;
                ({ newEdge, fromNodeId, fromPortNum, fromContainerNodeId} = linkOutputs(nodes[fromNodeId], fromPortNum, nodes[fromContainerNodeId], Object.assign({}, metadata)));
                joinedEdgeOrder += 1;
                fromEdgeSlices.push(newEdge);
                continue;
            }
            let newToEdge = null;
            ({ newEdge: newToEdge, toNodeId, toContainerNodeId } = linkInputs(nodes[toNodeId], nodes[toContainerNodeId], Object.assign({}, metadata)));
            toEdgeSlices.push(newToEdge);

            let newFromEdge = null;
            ({ newEdge: newFromEdge, fromNodeId, fromPortNum, fromContainerNodeId} = linkOutputs(nodes[fromNodeId], fromPortNum, nodes[fromContainerNodeId], Object.assign({}, metadata)));
            joinedEdgeOrder += 1;
            fromEdgeSlices.push(newFromEdge);
        }
    });
    return slicedEdges;
}

/**
 * A thunk which returns a selector. The selector builds objects containing all of the nodes and edges leading up to a
 * head symbol, regardless of the expansion or contraction state of the graph.
 */
function makeGetFullGraphFromHead() {
    return createSelector(
        [
            (state, props) => props.payload.graphLoaded,
            (state) => state.program.symbolTable,
            (state, props) => props.symbolId,
        ],
        (graphLoaded, symbolTable, headSymbolId) => {
            if (!graphLoaded) {
                return null;
            }
            let { nodes, edges } = getNodesAndUnslicedEdges(headSymbolId, symbolTable);
            edges = sliceEdges(nodes, edges);
            return { nodes, edges };
        }
    )
}

// TODO document all this
// TODO center the ports; currently starts from the top of the terminal
// TODO handle excessive input ports (which would extend beyond terminal node's height) to a single node

function elkGraphToNodeList(elkNode, nodes=[], offset={x: 0, y: 0}) {
    for (let i = 0; i < elkNode.children.length; i++) {
        let {viewerObj, width, height, x, y, id, zOrder, temporalStep} = elkNode.children[i];
        let { type, symbolId } = viewerObj;
        let newNode = {key: id, type, symbolId, viewerObj, x: x + offset.x, y: y + offset.y, width, height, zOrder, isExpanded: elkNode.children[i].children.length > 0};
        if (newNode.type === 'graphcontainer') {
            newNode.isTemporal = temporalStep >= 0;
        }
        nodes.push(newNode);

        elkGraphToNodeList(elkNode.children[i], nodes, {x: x + offset.x, y: y + offset.y});
    }
    return nodes;
}

function getEdgePoints(edge, offset) {
    let points = [];
    let { startPoint, endPoint, bendPoints } = edge.sections[0];
    points.push({x: startPoint.x + offset.x, y: startPoint.y + offset.y});
    if (bendPoints) {
        bendPoints.forEach(({x, y}) => {
            points.push({x: x + offset.x, y: y + offset.y});
        });
    }
    points.push({x: endPoint.x + offset.x, y: endPoint.y + offset.y});
    return points;
}

function elkGraphToEdgeGroups(elkNode, edgeGroups={}, offset={x: 0, y: 0}) {
    for (let i = 0; i < elkNode.edges.length; i++) {
        let edge = elkNode.edges[i];
        let points = getEdgePoints(edge, offset);
        if (!(edge.metadata.joinedEdgeId in edgeGroups)) {
            edgeGroups[edge.metadata.joinedEdgeId] = [];
        }
        edgeGroups[edge.metadata.joinedEdgeId].push({points, argName: edge.metadata.edgeName, sourceSymbolId: portIdToSymbolId(edge.sources[0]), targetSymbolId: portIdToSymbolId(edge.targets[0]), order: edge.metadata.joinedEdgeOrder, viewerObj: edge.metadata.edgeDataViewerObj, zOrder: edge.metadata.zOrder, isTemporal: edge.metadata.isTemporalEdge});
    }
    for (let i = 0; i< elkNode.children.length; i ++) {
        let {x, y} = elkNode.children[i];
        elkGraphToEdgeGroups(elkNode.children[i], edgeGroups, {x: offset.x + x, y: offset.y + y});
    }
    return edgeGroups;
}

function elkGraphToEdgeList(root) {
    let edgeGroups = elkGraphToEdgeGroups(root);
    let edges = [];
    Object.entries(edgeGroups).forEach(([groupId, edgeGroup]) => {
        let edgeGroupSorted = edgeGroup.splice(0).sort(({order: order1}, {order: order2}) => order1 - order2);
        let newEdge = [edgeGroupSorted[0].points[0]];
        edgeGroupSorted.forEach(({points}) => points.forEach((point, i) => {if (i > 0) {newEdge.push(point)}}));
        edges.push({key: groupId, points: newEdge, viewerObj: edgeGroupSorted[0].viewerObj, argName: edgeGroupSorted[0].argName, zOrder: edgeGroupSorted[0].zOrder, isTemporal: edgeGroupSorted[0].isTemporal, sourceSymbolId: edgeGroupSorted[0].sourceSymbolId, targetSymbolId: edgeGroupSorted[edgeGroupSorted.length - 1].targetSymbolId});
    });
    return edges;
}

/**
 * A thunk which returns a graph in ELK format, subject to the properties contained in the viewer's `graphState`. This
 * composes `makeGetFullGraphFromHead()` so that the graph doesn't need to be completely reloaded every time the state
 * changes.
 */
export function makeGetElkGraphFromHead() {
    return createSelector(
        [
            makeGetFullGraphFromHead(),
            (state, props) => props.payload.graphState,
        ],
        (fullGraph, graphState) => {
            if (!graphState || !fullGraph) {
                return null;
            }
            let { nodes, edges } = fullGraph;
            // we must assign parents here because the objects produced are preserved throughout layouting; creating
            // them in `makeGetFullGraphFromHead()` persists data like breakpoints
            return getElkGraph(nodes, assignEdgeParents(nodes, edges), graphState);
        }
    )
}

function getNodeAndPortPositions(elkNode, positions={}, offset={x: 0, y: 0}) {
    positions[elkNode.id] = offset;
    if (elkNode.children) {
        elkNode.children.forEach(child => {
            getNodeAndPortPositions(child, positions, {x: offset.x + child.x, y: offset.y + child.y});
        });
    }
    if (elkNode.ports) {
        elkNode.ports.forEach(port => {
            getNodeAndPortPositions(port, positions, {x: offset.x + port.x, y: offset.y + port.y})
        });
    }
    return positions;
}

function getLastExistingInHierarchy(hierarchy, root) {
    let lastFoundPortId = null;
    let nodeHeight = 0;
    for (let i = 0; i < hierarchy.length; i++) {
        // hierarchy[i] is either a port or a node
        let nextNodeId = portIdToNodeId(hierarchy[i]);
        root = root.children.find(child => child.id === nextNodeId);
        if (!root) {
            return { lastFoundPortId, nodeHeight }
        }
        nodeHeight = root.height;
        lastFoundPortId = hierarchy[i];
    }
    return { lastFoundPortId, nodeHeight }
}

function buildTemporalEdges(root, nodePositions, edges) {
    // TODO put edges that travel farther above others from the same port
    let totalInputsToNode = {};
    edges.filter(({sourceHierarchy}) => portIdToPortNum(getLastExistingInHierarchy(sourceHierarchy, root).lastFoundPortId) >= 0)
        .forEach(({targetHierarchy}) => {
            let { lastFoundPortId: target } = getLastExistingInHierarchy(targetHierarchy, root);
            if (!(target in totalInputsToNode)) {
                totalInputsToNode[target] = 0;
            }
            totalInputsToNode[target] += 1;
        });
    let outputCountByPort = {};
    let inputCountByNode = {};
    return edges.filter(({sourceHierarchy}) => portIdToPortNum(getLastExistingInHierarchy(sourceHierarchy, root).lastFoundPortId) >= 0)
        .map(({id, sourceHierarchy, targetHierarchy, metadata}) => {
        let { lastFoundPortId: source } = getLastExistingInHierarchy(sourceHierarchy, root);
        let sourceNode = source;
        let { lastFoundPortId: target, nodeHeight: targetHeight } = getLastExistingInHierarchy(targetHierarchy, root);
        if (!(sourceNode in outputCountByPort)) {
            outputCountByPort[sourceNode] = 0;
        }
        outputCountByPort[sourceNode] += 1;

        if (!(target in inputCountByNode)) {
            inputCountByNode[target] = 0;
        }
        inputCountByNode[target] += 1;

        let startPoint = {x: nodePositions[source].x, y: nodePositions[source].y};
        let portSep = (targetHeight / (totalInputsToNode[target] + 1));
        let endPoint = {x: nodePositions[target].x, y: nodePositions[target].y + portSep * (inputCountByNode[target])};
        let slope = (endPoint.y - startPoint.y) / (endPoint.x - startPoint.x);
        let length = Math.sqrt((endPoint.y - startPoint.y)**2 + (endPoint.x - startPoint.x)**2);
        let orthogonal = -1 / slope;
        let curveLen = length * kCurvePointFactor;
        let curveX = Math.sqrt(curveLen**2 / (1 + orthogonal**2));
        let curveY = orthogonal * curveX;
        if (curveY > 0) {
            curveY *= -1;
            curveX *= -1;
        }
        let halfway = {x: (startPoint.x + endPoint.x) / 2, y: (startPoint.y + endPoint.y) / 2};

        let curvePoint = {x: halfway.x + curveX, y: halfway.y + curveY};
        let bendPoints = [
            {x: startPoint.x, y: startPoint.y - kEdgeMargin * outputCountByPort[sourceNode]},
            curvePoint,
            {x: endPoint.x - kEdgeMargin, y: endPoint.y},
            //{x: (endPoint.x + startPoint.x) / 2, y: startPoint.y - kEdgeMargin * outputCountByPort[source]},
           // {x: (endPoint.x + startPoint.x) / 2, y: endPoint.y}
        ];
        return {id, sections: [{
            startPoint,
            endPoint,
            bendPoints}],
            sources: [source],
            targets: [target],
            metadata
        }
    });
}

function layoutGraphRecurse(elk, toLayout, viewerId, setInPayload) {
    let rootNode = toLayout[0];
    if (rootNode.id === 'root' || (rootNode.children.length > 0 && rootNode.children[0].temporalStep >= 0)) {
        elk.layout(rootNode).then(
            () => {
                if (rootNode.children && rootNode.children.length > 0 && rootNode.children[0].temporalStep >= 0) {
                    let sortedContainers = new Array(rootNode.children.length).fill(0);
                    rootNode.children.forEach(child => sortedContainers.splice(child.temporalStep, 1, child));
                    rootNode.width = 0;
                    rootNode.height = 0;
                    let xPos = kContainerPadding;
                    let maxChildHeight = 0;
                    sortedContainers.forEach(child => {
                        child.x = xPos;
                        rootNode.width = Math.max(rootNode.width, xPos + child.width + kContainerPadding);
                        rootNode.height = Math.max(rootNode.height, child.height + kContainerPadding * 2);
                        xPos += child.width + kTemporalContainerMargin;
                        maxChildHeight = Math.max(maxChildHeight, child.height);
                    });
                    sortedContainers.forEach(child => {
                        let heightDiff = maxChildHeight - child.height;
                        child.children.forEach(grandchild => grandchild.y += heightDiff);
                        child.ports.forEach(port => port.y += heightDiff);
                        child.edges.forEach(edge =>
                            [edge.sections[0].startPoint, edge.sections[0].endPoint].concat(edge.sections[0].bendPoints ? edge.sections[0].bendPoints : []).forEach(point => point.y += heightDiff));
                        child.height = maxChildHeight;
                        child.y = rootNode.height - kContainerPadding - child.height;
                    });
                }
                rootNode.properties['elk.algorithm'] = 'elk.fixed';
                if (rootNode.children) {
                    rootNode.children.forEach(child => {
                        child.properties['elk.algorithm'] = 'elk.fixed';
                    });
                }
                if (toLayout.length > 1) {
                    layoutGraphRecurse(elk, toLayout.splice(1), viewerId, setInPayload);
                }
                else {
                    let positions = getNodeAndPortPositions(rootNode);
                    rootNode.edges = rootNode.edges.concat(buildTemporalEdges(rootNode, positions, rootNode.temporalEdges));
                    console.log(rootNode);
                    setInPayload(viewerId, ['graph'], {
                        width: rootNode.width,
                        height: rootNode.height,
                        nodes: elkGraphToNodeList(rootNode),
                        edges: elkGraphToEdgeList(rootNode)
                    });
                }
            }
        );
    }
    else {
        layoutGraphRecurse(elk, toLayout.splice(1), viewerId, setInPayload);
    }
}

function getElkNodeLayoutOrder(toLayout, i=0) {
    if (i === toLayout.length) {
        return toLayout.reverse();
    }
    toLayout[i].children.forEach(child => {
        toLayout.push(child);
    });
    return getElkNodeLayoutOrder(toLayout, i + 1);
}


/**
 *
 * @param elk
 * @param rootNode
 * @param viewerId
 * @param setInPayload
 */
export function layoutGraph(elk, rootNode, viewerId, setInPayload) {
    layoutGraphRecurse(elk, getElkNodeLayoutOrder([rootNode]), viewerId, setInPayload);
}
