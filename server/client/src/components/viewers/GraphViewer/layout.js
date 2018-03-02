import {createSelector} from "reselect";

const opNodeHeight = 60;
const opNodeWidth = 60;
const dataNodeHeight = 45;
const dataNodeWidth = 45;
const collapsedAbstractiveHeight = 80;
const collapsedAbstractiveWidth = 80;
const collapsedTemporalHeight = 120;
const collapsedTemporalWidth = 60;
const temporalContainerPadding = 40;
const temporalEdgeBelowPadding = 6;
const elkChildParentPadding = 12;
const elkEdgePadding = 10;

/**
 * Creates an object which contains all information needed to lay out and render a graph node.
 */
function getNode(nodeId, symbolId, symbolInfo, container, inPorts, outPorts, contents=[], containsTemporal=false, temporalStep=-1) {
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
        inPorts,
        outPorts,
        outermost: !container,
        contents,
        orientation: containsTemporal ? "RIGHT" : "DOWN",
        temporalStep,
    };
}

/**
 * Gets all graph ops which are ancestors to the given op by iterating backwards in the DAG.
 * @param startOpId
 * @param symbolTable
 * @returns {object} the node objects for all found ops, a dict mapping data symbol IDs to the IDs of ops that use them
 *      as input, and a set containing the containers of all found ops
 */
function getOpNodes(startOpId, symbolTable) {
    let checkedOps = new Set();
    let opsToCheck = [startOpId];
    // Maps the symbol IDs of data nodes to all op IDs that use the data as input; needed to build and slice edges later
    let dataOutputs = {};
    let containersToCheck = [];
    let opNodes = {};
    while (opsToCheck.length > 0) {
        let symbolId = opsToCheck.pop();
        if (checkedOps.has(symbolId) || symbolId === null) {
            continue;
        }
        checkedOps.add(symbolId);
        const viewerData = symbolTable[symbolId].data.viewer;
        const args = viewerData.args;
        const kwargs = Object.values(viewerData.kwargs);
        args.forEach((arg, i) => {
            if (arg === null) {
                return;
            }
            opsToCheck.push(symbolTable[arg].data.viewer.creatorop);
            if (!(arg in dataOutputs)) {
                dataOutputs[arg] = []
            }
            dataOutputs[arg].push({opId: symbolId, toPos: i});
        });

        kwargs.forEach((kwarg, i) => {
            opsToCheck.push(symbolTable[kwarg].data.viewer.creatorop);
            if (!(kwarg in dataOutputs)) {
                dataOutputs[kwarg] = [];
            }
            dataOutputs[kwarg].push({opId: symbolId, toPos: i + args.length});
        });
        let container = viewerData.container;
        if (container) {
            containersToCheck.push(container);

        }
        opNodes[symbolId] = getNode(symbolId, symbolId, symbolTable[symbolId], container, args.length + kwargs.length, viewerData.numoutputs);
    }
    return {opNodes, dataOutputs, containersToCheck}
}

/**
 * Builds the edges connecting ops (concealing a graphdata), graph data nodes (if a graphdata is a leaf), and edges
 * connecting data to ops (if an op has a leaf as input).
 * @param dataOutputs
 * @param symbolTable
 */
function getDataNodesAndEdges(opNodes, dataOutputs, symbolTable) {
    // TODO put data on unslicedEdges
    let dataNodes = {};
    let unslicedEdges = [];
    let dataContainers = {};
    Object.entries(dataOutputs).forEach(([symbolId, futureOps]) => {
        let creatorOp = symbolTable[symbolId].data.viewer.creatorop;
        let creatorPos = symbolTable[symbolId].data.viewer.creatorpos;
        if (creatorOp === null) {
            futureOps.forEach(({opId, toPos}, i) => {
                let container = opNodes[opId].container;
                if (container !== null) {
                    let nextContainer = symbolTable[container].data.viewer.container;
                    while (nextContainer) {
                        container = nextContainer;
                        nextContainer = symbolTable[container].data.viewer.container;
                    }
                }
                if (!(container in dataContainers)) {
                    dataContainers[container] = [];
                }
                let nodeId = `${i}${symbolId}`;
                dataContainers[container].push(nodeId);
                dataNodes[nodeId] = getNode(nodeId, symbolId, symbolTable[symbolId], container, 0, futureOps.length);
                unslicedEdges.push([nodeId, 0, opId, toPos]);
            });
        }
        else {
            futureOps.forEach(({opId, toPos}) => {
                unslicedEdges.push([creatorOp, creatorPos, opId, toPos]);
            });
        }
    });
    return { dataNodes, dataContainers, unslicedEdges }
}

/**
 * Creates node objects for every container found while building the graph, as well as any ancestor containers they
 * might have.
 * @param containersToCheck {Array} set of container symbol IDs found while building DAG ops
 * @param symbolTable {Object}
 * @returns {{containers: Set<any>, containerNodes: {}}}
 */
function getContainerNodes(containersToCheck, dataContainers, symbolTable) {
    let checkedContainers = new Set();
    let containerNodes = {};
    while (containersToCheck.length > 0) {
        let symbolId = containersToCheck.pop();
        if (checkedContainers.has(symbolId) || symbolId === null) {
            continue;
        }
        checkedContainers.add(symbolId);
        let viewerData = symbolTable[symbolId].data.viewer;
        let contents = viewerData.contents;
        if (symbolId in dataContainers) {
            contents = contents.concat(dataContainers[symbolId])
        }
        if (contents.length === 0) {
            continue;
        }
        let container = viewerData.container;
        if (container) {
            containersToCheck.push(container);
        }
        // We can just check the first element, since it contains either only temporal or no temporal
        containerNodes[symbolId] = getNode(symbolId, symbolId, symbolTable[symbolId], container, 0, 0, contents,
            symbolTable[contents[0]].data.viewer.temporalstep >= 0, symbolTable[symbolId].data.viewer.temporalstep);
    }
    return { containers: checkedContainers, containerNodes };
}

/**
 * Helper methods for slicing DAG edges.
 */
const toInPort = (symbolId, port) => symbolId + '_i' + port;
const toOutPort = (symbolId, port) => symbolId + '_o' + port;
const containerHeight = (containerId, symbolTable) => symbolTable[containerId].data.viewer.height;
// TODO this will break on nodes that are in multiple temporal containers (can start with integer)
const getSymbolFromPort = (portId) => {
  return portId.split('_')[0];
};
const getNodeIdFromPort = (portId) => {
    return portId.split('_')[0];
};

/**
 * Creates a new edge connecting either a graphop or a container's output at a given port to the node's parent at their
 * next unoccupied output port.
 * @param child {String} symbol ID of the child
 * @param childPort (int) child output port
 * @param parent (String) symbol ID of the parent
 * @param slicedEdges (Object) collection of sliced edges to which the new edge should be added
 * @param symbolTable {Object}
 * @param nodes {Object} object containing graph's node objects
 * @returns {{fromId: *, fromPort: number, fromContainer}}
 */
function linkOutputs(child, childPort, parent, slicedEdges, nodes) {
    let grandparent = nodes[parent].container;
    slicedEdges.push([toOutPort(child, childPort), toOutPort(parent, nodes[parent].outPorts), parent, grandparent]);
    nodes[parent].outPorts += 1;
    return { fromId: parent, fromPort: nodes[parent].outPorts - 1, fromContainer: grandparent };
}

/**
 * Creates a new edge connecting either a graphop or a container's input at a given port to the node's parent at their
 * next unoccupied input port.
 * @param child {String} symbol ID of the child
 * @param childPort (int) child input port
 * @param parent (String) symbol ID of the parent
 * @param slicedEdges (Object) collection of sliced edges to which the new edge should be added
 * @param symbolTable {Object}
 * @param nodes {Object} object containing graph's node objects
 * @returns {{toId: *, toPort: number, toContainer}}
 */
function linkInputs(child, childPort, parent, slicedEdges, nodes) {
    let grandparent = nodes[parent].container;
    slicedEdges.push([toInPort(parent, nodes[parent].inPorts), toInPort(child, childPort), parent, grandparent]);
    nodes[parent].inPorts += 1;
    return { toId: parent, toPort: nodes[parent].inPorts - 1, toContainer: grandparent };
}

/**
 * Slices edges between op and data nodes into edges that route through containers and ports.
 *
 * ELK requires that edges can only connect nodes of the same height or nodes with their containers. Our DAG only
 * encodes edges between data and ops, so we need to take these edges and "slice" them where they pass into or out of
 * containers.
 * @param unslicedEdges
 * @param nodes
 * @param symbolTable
 * @param containers
 */
function sliceEdges(unslicedEdges, nodes, symbolTable, containers) {
    let slicedEdges = {null: []};
    containers.forEach(symbolId => slicedEdges[symbolId] = []);
    let temporalEdges = [];
  //  let temporalFromEdges = [];
  //  let temporalToEdges = [];
 //   containers.forEach(symbolId => temporalFromEdges[symbolId] = []);
 //   containers.forEach(symbolId => temporalToEdges[symbolId] = []);
    let temporalPorts = new Set();
    unslicedEdges.forEach(unslicedEdge => {
        let [fromId, fromPort, toId, toPort] = unslicedEdge;
        let newFromEdges = [];
        let newToEdges = [];
        containers.forEach(symbolId => newFromEdges[symbolId] = []);
        containers.forEach(symbolId => newToEdges[symbolId] = []);
        let fromContainer = nodes[fromId].container;
        let toContainer = nodes[toId].container;
        // Container is undefined for data nodes, so we need to keep it uniform with top-level nestables and make them
        // `null`
        if (!fromContainer) {
            fromContainer = null;
        }
        if (!toContainer) {
            toContainer = null;
        }
        while (true) {
            if (toContainer === fromContainer) {
                newFromEdges.push([toOutPort(fromId, fromPort), toInPort(toId, toPort), fromContainer, fromContainer]);
                break;
            }
            if (!toContainer || (fromContainer &&
                    containerHeight(toContainer, symbolTable) > containerHeight(fromContainer, symbolTable))) {
                ({
                    fromId,
                    fromPort,
                    fromContainer
                } = linkOutputs(fromId, fromPort, fromContainer, newFromEdges, nodes));
                continue;
            }
            if (!fromContainer || (toContainer &&
                    containerHeight(toContainer, symbolTable) < containerHeight(fromContainer, symbolTable))) {
                ({toId, toPort, toContainer} = linkInputs(toId, toPort, toContainer, newToEdges, nodes));
                continue;
            }
            ({
                fromId,
                fromPort,
                fromContainer
            } = linkOutputs(fromId, fromPort, fromContainer, newFromEdges, nodes));
            ({toId, toPort, toContainer} = linkInputs(toId, toPort, toContainer, newToEdges, nodes));
        }
        if (nodes[toId].temporalStep === -1 && nodes[fromId].temporalStep === -1) {
            newFromEdges.forEach(([fromId, toId, trueParent, elkParent]) => {
                slicedEdges[elkParent].push([fromId, toId, trueParent]);
            });
            newToEdges.forEach(([fromId, toId, trueParent, elkParent]) => {
                slicedEdges[elkParent].push([fromId, toId, trueParent]);
            });
        }
        else {
            // TODO put data on these edges
            let fromSequence = [];
            newFromEdges.forEach(([fromId]) => {
                fromSequence.push(fromId);
            });
            let firstRecipient = fromSequence.length;
            fromSequence.push(newFromEdges[newFromEdges.length - 1][1]);
            let mapToOutermost = [];
            let n = getNodeIdFromPort(fromSequence[firstRecipient]);
            while (nodes[n].container) {
                n = nodes[n].container;
                mapToOutermost.push(n);
            }
            mapToOutermost.reverse();

            let toSequence = [];
            newToEdges.forEach(([fromId, toId]) => {
                toSequence.push(toId);
                temporalPorts.add(toId);
            });
            toSequence.reverse();
            temporalEdges.push({slices: fromSequence.concat(toSequence), firstRecipient, mapToOutermost});
        }
    });


    // Any edges that are not the child of any container become the child of the graph's root node (all nodes in an ELK
    // graph are descendants of a single root node)
    slicedEdges['root'] = slicedEdges[null];
   // temporalFromEdges['root'] = temporalFromEdges[null];
 //   temporalToEdges['root'] = temporalToEdges[null];
    return { slicedEdges, temporalEdges, temporalPorts };
}

function slicedEdgesToElk(edges, graphState) {
    return edges.filter(([fromId, toId, trueParent]) => {
        return (!graphState[trueParent] || graphState[trueParent].expanded);
    }).map(([fromId, toId]) => {
        return {id: fromId + toId, sources: [fromId], targets: [toId]};
    })
}

function getElkNode(nodeId, nodes, edges, temporalPorts, graphState) {
    let node = nodes[nodeId];
    let children = [];
    if (graphState[node.symbolId].expanded) {
        // won't let me map or iterate over node.contents for some reason
        for (let i=0; i < node.contents.length; i++) {
            let childId = node.contents[i];
            children.push(getElkNode(childId, nodes, edges, temporalPorts, graphState));
        }

    }
    let elkNode = {
        id: nodeId,
        properties: {'elk.direction': node.orientation,
            "portConstraints": "FIXED_SIDE"},
        viewerObj: node.viewerObj,
        temporalStep: node.temporalStep,
        children,
        edges: [],
    };

    //TODO ignore ports used in temporal edges
    // TODO optimize port ordering somehow
    let ports = [];
    for (let i=0; i < node.inPorts; i++) {
        let portId = toInPort(nodeId, i);
        let side = node.temporalStep >= 0 ? "WEST" : "NORTH";
        let port = {id: portId,
            "properties":{
                "port.side": side,
            }};
        ports.push(port);
    }
    for (let i=0; i < node.outPorts; i++) {
        let side = node.temporalStep >= 0 ? "EAST" : "SOUTH";
        ports.push({id: toOutPort(nodeId, i),
            "properties":{
                "port.side": side,
            }});
    }
    elkNode.ports = ports;

    if (node.type === 'graphcontainer' && nodeId in edges && graphState[node.symbolId].expanded) {
        elkNode.edges = slicedEdgesToElk(edges[nodeId], graphState);
    }
    if (node.type === 'graphop') {
        elkNode.height = opNodeHeight;
        elkNode.width = opNodeWidth;
    }
    if (node.type === 'graphdata') {
        elkNode.height = dataNodeHeight;
        elkNode.width = dataNodeWidth;
    }
    if (node.temporalStep >= 0 && !graphState[node.symbolId].expanded) {
        elkNode.height = collapsedTemporalHeight;
        elkNode.width = collapsedTemporalWidth;
    }
    if (node.temporalStep === -1 && !graphState[node.symbolId].expanded) {
        elkNode.height = collapsedAbstractiveHeight;
        elkNode.width = collapsedAbstractiveWidth;
    }
    return elkNode;
}

function getElkGraph(nodes, edges, temporalEdges, temporalPorts, graphState) {
    return {
        id: 'root',
        properties: {'elk.direction': 'RIGHT'},
        children: Object.entries(nodes).filter(([nodeId, node]) => node.outermost).map(([nodeId]) => getElkNode(nodeId, nodes, edges, temporalPorts, graphState)),
        edges: slicedEdgesToElk(edges['root'], graphState),
        temporalEdges: temporalEdges,
    };
}

/**
 * A thunk which returns a selector. The selector builds objects containing the graph's nodes and edges. TODO
 * @returns {Object} Maps 'nodes' to `{symbolId: {properties}` for each node in the graph; see `getNode` for structure.
 *      Also maps 'edges' to `{container: [edges within container]}`, as this is the format needed by ELK.
 */
export function makeGetGraphFromHead() {
    return createSelector(
        [
            (state) => state.symboltable,
            (state, props) => props.symbolId,
            (state, props) => state.canvas.viewerObjects[props.viewerId].payload.graphState,
        ],
        (symbolTable, headSymbolId, graphState) => {
            if (!graphState) {
                return null;
            }
            let headViewerData = symbolTable[headSymbolId].data.viewer;

            let { opNodes, dataOutputs, containersToCheck } = getOpNodes(headViewerData.creatorop, symbolTable);
            let { dataNodes, dataContainers, unslicedEdges } = getDataNodesAndEdges(opNodes, dataOutputs, symbolTable);
            let headContainer = opNodes[symbolTable[headSymbolId].data.viewer.creatorop].container;
            if (headContainer !== null) {
                let nextContainer = symbolTable[headContainer].data.viewer.container;
                while (nextContainer) {
                    headContainer = nextContainer;
                    nextContainer = symbolTable[headContainer].data.viewer.container;
                }
            }
            dataNodes[headSymbolId] = getNode(headSymbolId, headSymbolId, symbolTable[headSymbolId], headContainer, 1, 0);
            if (!(headContainer in dataContainers)) {
                dataContainers[headContainer] = [];
            }
            dataContainers[headContainer].push(headSymbolId);
            let { containerNodes, containers } = getContainerNodes(containersToCheck, dataContainers, symbolTable);

            let nodes = {
                ...opNodes,
                ...dataNodes,
                ...containerNodes,
            };

            unslicedEdges.push([headViewerData.creatorop, headViewerData.creatorpos, headSymbolId, 0]);
            let  { slicedEdges, temporalEdges, temporalPorts } = sliceEdges(unslicedEdges, nodes, symbolTable, containers);
            return getElkGraph(nodes, slicedEdges, temporalEdges, temporalPorts, graphState); // TODO aspect ratio?
        }
    )
}

function findNodeFromMap(graph, mapToOutermost) {
    let offset = {x: 0, y: 0};
    mapToOutermost.forEach(nodeId => {
        offset.x += graph.x;
        offset.y += graph.y;
        graph = graph.children.find(({id}) => id === nodeId);
    });
    return { node: graph, offset};
}

function getTemporalSegments(graph, slices, firstRecipient, mapToOutermost, numEdgesByNode, isFrom) {
    let sliceIndex = -1;
    if (isFrom) {
        sliceIndex = firstRecipient - 1;
    }
    else {
        sliceIndex = firstRecipient;
    }
    let {node, offset} = findNodeFromMap(graph, mapToOutermost);
    node = node.children.find(({id}) => id === getNodeIdFromPort(slices[sliceIndex]));
    let segments = [];
    let numContainers = -1;  // compensate for the temporal container
    while (node.children.length > 0) {
        numContainers += 1;
        if (isFrom) {
            sliceIndex --;
        }
        else {
            sliceIndex ++;
        }
        let endPoint = {x: node.x + (isFrom ? node.width : 0) + offset.x, y: 0};  // needs to be offset by parent location
        offset.x += node.x;
        offset.y += node.y;
        node = node.children.find(({id}) => id === getNodeIdFromPort(slices[sliceIndex]));
        segments.push({sections: [{startPoint: {x: node.x + (isFrom ? node.width : 0) + offset.x , y: 0}, endPoint}]});
    }
    let yPos = 0;
    let portObj = node.ports.find(({id}) => id === slices[sliceIndex]);
    if (isFrom) {
        if (node.id in numEdgesByNode) {
            numEdgesByNode[node.id] += 1;
        }
        else {
            numEdgesByNode[node.id] = 0;
        }
        yPos = node.y + portObj.y + offset.y;
        console.log(node.temporalStep);
        if (node.temporalStep === -1) {
            let yOffsetFromPort = temporalEdgeBelowPadding + numContainers * elkChildParentPadding + elkEdgePadding * numEdgesByNode[node.id];
            let segmentToOutput = {sections: [{startPoint: {x: node.x + portObj.x + offset.x, y: 0}, endPoint: {x: node.x + node.width + offset.x, y: 0}}]};
            segments.push(segmentToOutput);
            let segmentToPort = {sections: [{startPoint: {x: node.x + portObj.x + offset.x, y: -yOffsetFromPort}, endPoint: {x: node.x + portObj.x + offset.x, y: 0}}]};
            segments.push(segmentToPort);
            yPos += yOffsetFromPort;
        }
        else {
            segments.push({sections: [{startPoint: {x: node.x + portObj.x + offset.x, y: 0}, endPoint: {x: node.x + portObj.x + offset.x, y: 0}}]});
        }
    }
    else {
        if (node.id in numEdgesByNode) {
            numEdgesByNode[node.id] += 1;
        }
        else {
            numEdgesByNode[node.id] = 0;
        }
        yPos = node.y + numEdgesByNode[node.id] * elkEdgePadding + offset.y;
        if (node.temporalStep >= 0) {
            segments.push({sections: [{startPoint: {x: node.x + offset.x, y: 0}, endPoint: {x: node.x + offset.x, y: 0}}]})
        }
    }
    segments.forEach(edge => {
        edge.sections[0].startPoint.y += yPos;
        edge.sections[0].endPoint.y += yPos;
        edge.portOrder = numEdgesByNode[node.id];
    });
    return  { segments, split: numEdgesByNode[node.id] + 1 };
}

function joinTemporalSegments(startPoint, endPoint, split) {
    // TODO centering
    let newSection = {startPoint, endPoint};
    newSection.bendPoints = [{x: endPoint.x + elkEdgePadding * split , y: startPoint.y},
        {x:endPoint.x + elkEdgePadding * split, y: endPoint.y}];
    return {sections: [newSection]}
}

function addTemporalEdges(graph) {
    let temporalEdges = graph.temporalEdges;
    let numOutEdgesByNode = {};
    let numInEdgesByNode = {};
    temporalEdges.forEach(({slices, firstRecipient, mapToOutermost})=> {
        let { segments: outSegments, split: outSplit } = getTemporalSegments(graph, slices, firstRecipient, mapToOutermost, numOutEdgesByNode, true);
        let { segments: inSegments, split: inSplit } = getTemporalSegments(graph, slices, firstRecipient, mapToOutermost, numInEdgesByNode, false);
        graph.edges = graph.edges.concat(outSegments);
        graph.edges = graph.edges.concat(inSegments);
        graph.edges.push(joinTemporalSegments(inSegments[0].sections[0].endPoint, outSegments[0].sections[0].endPoint, Math.max(inSplit, outSplit)));
        // TODO merge edges into one w/ bendpoints for curvy edges
        // TODO test with nested temporal containers
        // TODO extend temporal container
        // TODO push everything downward away from edges
        // TODO increase padding between temporal containers based on number of temporal connections between
        // TODO prevent overlap with elk-laid-out edges
    });
}

export function layoutGraph(elk, root, viewerId=null, setInPayload=null) {
    return Promise.all(root.children.map(child => layoutGraph(elk, child)))
        .then(
            () => {
                elk.layout(root).then(
                    (laidOutGraph) => {
                        Object.assign(root, laidOutGraph);
                        root.properties['elk.algorithm'] = 'fixed';
                        if (root.children && root.children.length > 0 && root.children[0].temporalStep >= 0) {
                            let sortedContainers = new Array(root.children.length).fill(0);
                            root.children.forEach((child) => {
                               sortedContainers.splice(child.temporalStep, 1, child);
                            });
                            sortedContainers.forEach((child, i) => {
                                child.y = 0;
                                if (i === 0) {
                                    child.x = 0;
                                }
                                else {
                                    child.x = sortedContainers[i-1].x + sortedContainers[i-1].width + temporalContainerPadding;
                                }
                            });
                        }
                        if (viewerId !== null && setInPayload !== null) {
                            addTemporalEdges(laidOutGraph);
                            setInPayload(viewerId, ['graph'], root);
                        }
                    }
                );
            }
        )
}

export const portIdToNodeId = (portId) => portId.split('_')[0];