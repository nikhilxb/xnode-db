import {createSelector} from "reselect";


//TODO add data to edges
/**
 * Layout constants.
 */
const opNodeHeight = 60;
const opNodeWidth = 60;
const dataNodeHeight = 45;
const dataNodeWidth = 45;
const collapsedAbstractiveHeight = 80;
const collapsedAbstractiveWidth = 80;
const collapsedTemporalHeight = 120;
const collapsedTemporalWidth = 60;
const elkEdgePadding = 10;

/**
 * Creates a "node object" which can be translated into a node in the ELK graph; data, ops, and container nodes are
 * represented as node objects.
 * @param nodeId: unique identifier for the node object.
 * @param symbolId: id of the symbol represented by the node. Note that two node objects may share a symbol id, as
 *                  GraphData which are used in multiple timesteps have a node created in each temporal container.
 * @param symbolInfo: the symbol's entry in the symbol table.
 * @param container: the node id of the node's container.
 * @param outPorts: the number of output ports the node has; typically modified after node object creation. For example,
 *                  an op node might be created before all of its outputs have been explored in the graph, meaning that
 *                  `outPorts` cannot be set until after the whole graph is created.
 * @param height: how many layers are nested within the node. 0 for ops and data.
 * @param contents: a list of all node ids contained by the node.
 * @param containsTemporal: whether the node contains any temporal containers; needed for proper orientation of
 *                          contents in the ELK graph.
 * @param isTemporal: whether the node is a temporal container.
 */
function createNodeObj(nodeId, symbolId, symbolInfo, container, outPorts=0, height=0, contents=[], containsTemporal=false, isTemporal=false) {
    return {
        viewerObj: {
            symbolId: symbolId,
            type: symbolInfo.type,
            name: symbolInfo.name,
            str: symbolInfo.str,
            payload: symbolInfo.data.viewer,
        },
        type: symbolInfo.type,
        symbolId,
        nodeId,
        container,
        outermost: container === 'root',
        inPorts: 0,
        outPorts,
        contents,
        height,
        orientation: containsTemporal ? "RIGHT" : "DOWN",
        isTemporal,
    };
}

/**
 * Getter methods
 */
const getCreatorOp = (dataSymbolId, symbolTable) => symbolTable[dataSymbolId].data.viewer.creatorop;
const getCreatorPos = (dataSymbolId, symbolTable) => symbolTable[dataSymbolId].data.viewer.creatorpos;
const getArgs = (opSymbolId, symbolTable) => symbolTable[opSymbolId].data.viewer.args;
const getKwargValues = (opSymbolId, symbolTable) => Object.values(symbolTable[opSymbolId].data.viewer.kwargs);
const getContainerSymbolId = (symbolId, symbolTable) => symbolTable[symbolId].data.viewer.container;
const getContents = (containerSymbolId, symbolTable) => symbolTable[containerSymbolId].data.viewer.contents;
const getContainerHeight = (containerSymbolId, symbolTable) => symbolTable[containerSymbolId].data.viewer.height;
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
const symbolIdToNodeId = (symbolId, nodeNum=0) => symbolId === null ? 'root' : `${nodeNum}${symbolId}`;
const portIdToNodeId = (portId) => portId.indexOf('_') >= 0 ? portId.split('_')[0] : portId;
const nodeIdToPortId = (nodeId, portNum, isInput=false) => `${nodeId}_${portNum}` + (isInput ? 'i' : 'o');

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

    // Add info for the head data node, since we iterate over ops
    edges.push([symbolIdToNodeId(getCreatorOp(headSymbolId, symbolTable)),
                getCreatorPos(headSymbolId, symbolTable),
                symbolIdToNodeId(headSymbolId)]);
    opsToCheck.push(getCreatorOp(headSymbolId, symbolTable));
    dataLeafContainers[headSymbolId] = [getFirstTemporalContainerSymbolId(getCreatorOp(headSymbolId, symbolTable), symbolTable)];
    opOutputs[symbolIdToNodeId(getCreatorOp(headSymbolId, symbolTable))] = new Set([headSymbolId]);

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
            symbolTable[opSymbolId],
            symbolIdToNodeId(getContainerSymbolId(opSymbolId, symbolTable))
        );
        nodes = {
            ...nodes,
            ...getContainerNodes(opSymbolId, symbolTable),
        };
        // We don't assign input ports here, so args may be out of order. Since we moved temporal inputs to the side,
        // though, we can't possibly have order anyway.
        getArgs(opSymbolId, symbolTable)
            .concat(getKwargValues(opSymbolId, symbolTable))
            .filter(dataSymbolId => dataSymbolId !== null)
            .forEach(dataSymbolId => {
                // we don't need an input port since two things won't go into the same input
                if (getCreatorOp(dataSymbolId, symbolTable)) {
                    opsToCheck.push(getCreatorOp(dataSymbolId, symbolTable));
                    let creatorOpNodeId = symbolIdToNodeId(getCreatorOp(dataSymbolId, symbolTable));
                    if (!(creatorOpNodeId in opOutputs)) {
                        opOutputs[creatorOpNodeId] = new Set();
                    }
                    opOutputs[creatorOpNodeId].add(dataSymbolId);
                    edges.push([creatorOpNodeId, getCreatorPos(dataSymbolId, symbolTable), symbolIdToNodeId(opSymbolId)]);
                }
                else {
                    if (!(dataSymbolId in dataLeafContainers)) {
                        dataLeafContainers[dataSymbolId] = [];
                    }
                    let firstTemporalSymbolId = getFirstTemporalContainerSymbolId(opSymbolId, symbolTable);
                    if (dataLeafContainers[dataSymbolId].indexOf(firstTemporalSymbolId) === -1) {
                        dataLeafContainers[dataSymbolId].push(firstTemporalSymbolId);
                    }
                    // Data nodes only have one output port, so use 0 every time
                    edges.push([symbolIdToNodeId(dataSymbolId, dataLeafContainers[dataSymbolId].indexOf(firstTemporalSymbolId)), 0, symbolIdToNodeId(opSymbolId)]);
                }
            });
    }

    // Set the `outPorts` field of each op node object, now that we know how many outputs they will have.
    Object.entries(opOutputs).forEach(([opNodeId, outputSet]) => {
        nodes[opNodeId].outPorts = outputSet.size;
    });

    // Add data nodes, placed in the proper containers.
    Object.entries(dataLeafContainers).forEach(([dataSymbolId, dataNodeContainers]) => {
        dataNodeContainers.forEach((containerSymbolId, i) => {
            let containerNodeId = symbolIdToNodeId(containerSymbolId);
            let dataNodeId = symbolIdToNodeId(dataSymbolId, i);
            nodes[dataNodeId] = createNodeObj(
                dataNodeId,
                dataSymbolId,
                symbolTable[dataSymbolId],
                containerNodeId,
                dataSymbolId === headSymbolId ? 0 : 1);
            // `contents` is immutable since it is derived from the symbol table, so we have to operate on it like this
            nodes[containerNodeId].contents = nodes[containerNodeId].contents.concat([dataNodeId]);
        });
    });
    return { nodes, edges }
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
            symbolTable[containerId],
            symbolIdToNodeId(getContainerSymbolId(containerId, symbolTable)),
            0,
            getContainerHeight(containerId, symbolTable),
            getContents(containerId, symbolTable).map(opSymbolId => symbolIdToNodeId(opSymbolId)),
            getSymbolIsTemporal(getContents(containerId, symbolTable)[0], symbolTable),
            getSymbolIsTemporal(containerId, symbolTable));
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
        if (nodeId1 === null || nodes[nodeId1].height > nodes[nodeId2].height) {
            nodeId2 = nodes[nodeId2].container;
        }
        else if (nodeId2 === null || nodes[nodeId1].height < nodes[nodeId2].height) {
            nodeId1 = nodes[nodeId1].container;
        }
        else{
            nodeId1 = nodes[nodeId1].container;
            nodeId2 = nodes[nodeId2].container;
        }
    }
    return nodeId1;
}

/**
 * Creates arrays of ELK edge objects and associates them with the node id of the ELK node which should contain them.
 * @param nodes: mapping of node ids to node objects
 * @param edges: array of edges of the form `[fromPortId, toPortId, metadata]`. `fromPortId` must be an actual port, but
 *               `toPortId` may be either a port or a node
 */
function assignEdgeParents(nodes, edges) {
    let edgeParents = {'root': []};
    // to could be a port or a node id, depending on whether or not its a temporal slice
    edges.forEach(([fromPortId, toPortId, metadata]) => {
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
    let elkNode = {
        id: nodeObj.nodeId,
        properties: {
            'elk.direction': nodeObj.orientation,
            // We fix the positions of ports on temporal nodes so that we can ensure they go in the right direction
            'portConstraints': getNodeIsTemporal(nodeObj) ? 'FIXED_POS' : 'FREE'
        },
        viewerObj: nodeObj.viewerObj,
        temporal: getNodeIsTemporal(nodeObj),
        edges: [],
        children: [],
        ports: [],
    };
    if (graphState[nodeObj.symbolId].expanded) {
        // Trying to map over nodeObj.contents leads to unexpected behavior; TODO look into this
        for (let i=0; i < nodeObj.contents.length; i++) {
            let childNodeId = nodeObj.contents[i];
            elkNode.children.push(createElkNode(childNodeId, nodes, edges, graphState));
        }
    }
    for (let i=0; i < nodeObj.inPorts; i++) {
        let newPort = {
            id: nodeIdToPortId(nodeObj.nodeId, i, true),
            properties: {
                'port.side': getNodeIsTemporal(nodeObj) ? "WEST" : "NORTH",
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
    for (let i=0; i < nodeObj.outPorts; i++) {
        let newPort = {
            id: nodeIdToPortId(nodeObj.nodeId, i, false),
            properties: {
                'port.side': getNodeIsTemporal(nodeObj) ? "EAST": "SOUTH",
            }
        };
        if (getNodeIsTemporal(nodeObj)) {
            newPort.y = 0;
        }
        elkNode.ports.push(newPort);
    }
    if (nodeObj.type === 'graphcontainer') {
        if (graphState[nodeObj.symbolId].expanded) {
            if (nodeObj.nodeId in edges) {
                elkNode.edges = edges[nodeObj.nodeId];
            }
        }
        else if (getNodeIsTemporal(nodeObj)) {
            elkNode.height = collapsedTemporalHeight;
            elkNode.width = collapsedTemporalWidth;
        }
        else {
            elkNode.height = collapsedAbstractiveHeight;
            elkNode.width = collapsedAbstractiveWidth;
        }
    }
    else if (nodeObj.type === 'graphop') {
        elkNode.height = opNodeHeight;
        elkNode.width = opNodeWidth;
    }
    else if (nodeObj.type === 'graphdata') {
        elkNode.height = dataNodeHeight;
        elkNode.width = dataNodeWidth;
    }
    return elkNode;
}

/**
 * Builds the ELK graph to be laid out.
 * @param nodes: mapping of node ids to node objects
 * @param edges: mapping of node id to array of edges which should be given to that node in the ELK graph
 * @param graphState: mapping of symbol ids to properties about the graph
 */
function getElkGraph(nodes, edges, graphState) {
    let rootChildren =  Object.entries(nodes).filter(([nodeId, nodeObj]) => nodeObj.outermost).map(([nodeId]) => createElkNode(nodeId, nodes, edges, graphState));
    let orientation = rootChildren.length > 0 && rootChildren[0].temporal ? 'RIGHT' : 'DOWN';
    return {
        id: 'root',
        properties: {'elk.algorithm': 'layered', 'elk.direction': orientation},
        children: rootChildren,
        edges: edges['root'],
    }
}

/**
 * Create a new edge which connects a node's input port to  a new input port on its parent container.
 * @param toNode: node object
 * @param toContainer: node object
 */
function linkInputs(toNode, toContainer) {
    let newEdge = [
        nodeIdToPortId(toContainer.nodeId, toContainer.inPorts, true),
        nodeIdToPortId(toNode.nodeId, toNode.inPorts, true),
        {}
    ];
    toNode.inPorts += 1;
    return {newEdge, toNodeId: toContainer.nodeId, toContainerNodeId: toContainer.container}
}

/**
 * Create a new edge which connects a node's output port at port `fromPortNum` to a new output port on its parent
 * container.
 * @param fromNode: node object
 * @param fromPortNum: number identifying the port on `fromNode`
 * @param fromContainer: node object
 */
function linkOutputs(fromNode, fromPortNum, fromContainer) {
    let newEdge = [
        nodeIdToPortId(fromNode.nodeId, fromPortNum),
        nodeIdToPortId(fromContainer.nodeId, fromContainer.outPorts),
        {}
    ];
    fromContainer.outPorts += 1;
    return {newEdge, fromPortNum: fromContainer.outPorts - 1, fromNodeId: fromContainer.nodeId, fromContainerNodeId: fromContainer.container};
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
    unslicedEdges.forEach(edge => {
        let [fromNodeId, fromPortNum, toNodeId] = edge;
        let fromContainerNodeId = nodes[fromNodeId].container;
        let toContainerNodeId = nodes[toNodeId].container;
        // In the case of edges which cross temporal containers, we make our own edges after laying out instead of using
        // the new "to edge" slices. This allows us to maintain port alignment and prevent ELK's ugly attempts at making
        // these edges work.
        let toEdgeSlices = [];
        while (true) {
            if (toContainerNodeId === fromContainerNodeId) {
                let finalEdge = [
                    nodeIdToPortId(fromNodeId, fromPortNum),
                    nodeIdToPortId(toNodeId, nodes[toNodeId].inPorts, true),
                    {}
                ];
                // If the edge bridges two temporal containers, then we don't actually return `toEdgeSlices`. Instead,
                // we will create a new, prettier edge after the graph has been laid out, since ELK doesn't handle
                // the right-oriented cross-temporal edges well.
                if (getNodeIsTemporal(nodes[fromNodeId]) && getNodeIsTemporal(nodes[toNodeId])) {
                    finalEdge[2].routeToTerminal = [toNodeId].concat(toEdgeSlices.reverse().map(([fromPortId, toPortId]) => toPortId));
                }
                else{
                    slicedEdges = slicedEdges.concat(toEdgeSlices);
                }
                nodes[toNodeId].inPorts += 1;
                slicedEdges.push(finalEdge);
                break;
            }
            if (fromContainerNodeId === 'root' || nodes[fromContainerNodeId].height > nodes[toContainerNodeId].height) {
                let newEdge = null;
                ({ newEdge, toNodeId, toContainerNodeId } = linkInputs(nodes[toNodeId], nodes[toContainerNodeId]));
                toEdgeSlices.push(newEdge);
                continue;
            }
            if (toContainerNodeId === 'root' || nodes[toContainerNodeId].height > nodes[fromContainerNodeId].height) {
                let newEdge = null;
                ({ newEdge, fromNodeId, fromPortNum, fromContainerNodeId} = linkOutputs(nodes[fromNodeId], fromPortNum, nodes[fromContainerNodeId]));
                slicedEdges.push(newEdge);
                continue;
            }
            let newToEdge = null;
            ({ newEdge: newToEdge, toNodeId, toContainerNodeId } = linkInputs(nodes[toNodeId], nodes[toContainerNodeId]));
            toEdgeSlices.push(newToEdge);

            let newFromEdge = null;
            ({ newEdge: newFromEdge, fromNodeId, fromPortNum, fromContainerNodeId} = linkOutputs(nodes[fromNodeId], fromPortNum, nodes[fromContainerNodeId]));
            slicedEdges.push(newFromEdge);
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
            (state) => state.symboltable,
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

/**
 * Gets the y-offset of the node at the end of `routeToTerminal` from `parent`. `routeToTerminal` is typically created
 * in `sliceEdges()`, where it is attached as metadata to an edge object.
 * @param parent: an ELK node containing `routeToTerminal[0]`.
 * @param routeToTerminal: an array of node and port ids, where `routeToTerminal[i]` is a child or port of
 *                         `routeToTerminal[i-1]`.
 */
function getTerminalNodeOffset(parent, routeToTerminal) {
    let yOffset = 0;
    let hierarchyToTerminal = [];
    let currentNode = parent;
    for(let i = 0; i < routeToTerminal.length; i ++) {
        let portId = routeToTerminal[i];
        currentNode = currentNode.children.filter(({id}) => id === portIdToNodeId(portId))[0];
        // routeToTerminal is created independent of the graph state, where the ELK graph contains only those nodes
        // exposed in the current state, so its possible that this loop terminates earlier than the full length of
        // `routeToTerminal`.
        if (!currentNode) {
            break;
        }
        hierarchyToTerminal.push(currentNode.id);
        yOffset += currentNode.y;
    }
    return { yOffset, hierarchyToTerminal };
}

// TODO document all this
/**
 *
 * @param root
 * @param toPortId
 */
function getTemporalOutPort(root, toPortId) {
    let fromPortId = root.edges.filter(({targets}) => targets[0] === toPortId)[0].sources[0];
    return root.children.filter(({id}) => id === portIdToNodeId(fromPortId))[0].ports.filter(({id}) => id === fromPortId)[0];
}

/**
 *
 * @param parent
 * @param toPortId
 */
function getRouteToTerminal(parent, toPortId) {
    return parent.edges.filter(({targets}) => targets[0] === toPortId)[0].metadata.routeToTerminal;
}

/**
 *
 * @param hierarchyToTerminal
 * @param numTemporalPortsByTerminal
 * @returns {number}
 */
const getPortYOffset = (hierarchyToTerminal, numTemporalPortsByTerminal) => {
    let terminalId = hierarchyToTerminal[hierarchyToTerminal.length - 1];
    if (terminalId in numTemporalPortsByTerminal) {
        numTemporalPortsByTerminal[terminalId] += 1;
    }
    else {
        numTemporalPortsByTerminal[terminalId] = 1;
    }
    return elkEdgePadding * numTemporalPortsByTerminal[terminalId];
};

// TODO center the ports; currently starts from the top of the terminal
// TODO handle excessive input ports (which would extend beyond terminal node's height) to a single node
// TODO alignment assumes the output container is as tall as the input container, which can lead to detached edges
// Solution isn't immediately clear here. We could draw edges such that they start at some height on the output
// container and in-between the two get to the proper height, but this might require changes to x position
// of the containers to maintain edge spacing. We could have the input ports be at the same height as the
// output ports, but then we need to get the edges down to their destinations within the temporal container.
// The fact that we can't fix the port side of abstractive containers makes this very difficult.
/**
 *
 * @param node
 * @param parent
 * @param numTemporalPortsByTerminal
 * @param hierarchyToNode
 * @param temporalEdges
 */
function fixTemporalPortPositions(node, parent, numTemporalPortsByTerminal, hierarchyToNode, temporalEdges) {
    if (node.temporal) {
        node.ports.filter(({id}) => getPortIdIsInput(id)).forEach((inPort) => {
            let routeToTerminal = getRouteToTerminal(parent, inPort.id);
            let { yOffset: yOffsetTerminalNode, hierarchyToTerminal } = getTerminalNodeOffset(parent, routeToTerminal);
            yOffsetTerminalNode -= node.y;
            let yOffsetTerminalPort = yOffsetTerminalNode + getPortYOffset(hierarchyToTerminal, numTemporalPortsByTerminal);
            inPort.y = yOffsetTerminalPort;
            let connectedOutPort = getTemporalOutPort(parent, inPort.id);
            connectedOutPort.y = yOffsetTerminalPort;
            temporalEdges.push({hierarchyToSource: hierarchyToNode.slice(0).concat([portIdToNodeId(connectedOutPort.id), connectedOutPort.id]), hierarchyToTerminal: hierarchyToNode.slice(0).concat(hierarchyToTerminal)})
        });
    }
    hierarchyToNode.push(node.id);
    node.children.forEach(child => fixTemporalPortPositions(child, node, numTemporalPortsByTerminal, hierarchyToNode.slice(0), temporalEdges));
    return temporalEdges;
}

/**
 *
 * @param root
 * @param hierarchy
 */
function getOffsetFromHierarchy(root, hierarchy) {
    let offset = {x: 0, y: 0};
    let currentNode = root;
    for (let i = 1; i < hierarchy.length; i++) {
        // index 0 is always root
        if (getIdIsPort(hierarchy[i])) {
            currentNode = currentNode.ports.filter(({id}) => id === hierarchy[i])[0];
        }
        else {
            currentNode = currentNode.children.filter(({id}) => id === hierarchy[i])[0];
        }
        if (!currentNode) {
            break;
        }
        offset.y += currentNode.y;
        offset.x += currentNode.x;
    }
    return offset;
}

/**
 *
 * @param root
 * @param edges
 */
function getTemporalConnectorEdges(root, edges) {
    let retEdges = [];
    edges.forEach(({hierarchyToSource, hierarchyToTerminal}, i) => {
        let sourcePos = getOffsetFromHierarchy(root, hierarchyToSource);
        let terminalPos = getOffsetFromHierarchy(root, hierarchyToTerminal);
        retEdges.push({id: `temporal${i}`, sections: [{startPoint: sourcePos, endPoint: {x: terminalPos.x, y: sourcePos.y}}]});
    });
    return retEdges;
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
            console.log('stategraph');
            let { nodes, edges } = fullGraph;
            // we must assign parents here because the objects produced are preserved throughout layouting; creating
            // them in `makeGetFullGraphFromHead()` persists data like breakpoints
            return getElkGraph(nodes, assignEdgeParents(nodes, edges), graphState);
        }
    )
}

/**
 *
 * @param elk
 * @param rootNode
 * @param viewerId
 * @param setInPayload
 */
// Basically, we're hoping that between layout 1 and layout 2 no vertical positions change. This probably isn't a safe
// assumption long term.
export function layoutGraph(elk, rootNode, viewerId, setInPayload) {
    elk.layout(rootNode).then(
        (graphSpacedForTemporal) => {
            // TODO only re-layout changed nodes
            let temporalEdges = fixTemporalPortPositions(graphSpacedForTemporal, null, {}, [], []);
            elk.layout(graphSpacedForTemporal).then(
                (laidOutGraph) => {
                    laidOutGraph.edges = laidOutGraph.edges.concat(getTemporalConnectorEdges(laidOutGraph, temporalEdges));
                    setInPayload(viewerId, ['graph'], laidOutGraph)
                }
            );
        }
    )
}
