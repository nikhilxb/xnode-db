import {createSelector} from "reselect";

const nodeHeight = 60;
const nodeWidth = 150;

/**
 * Creates an object which contains all information needed to lay out and render a graph node.
 * @param symbolId: the ID of the node
 * @param symbolInfo: symbolTable[symbolId]
 * @param inPorts: number of input ports the node has; this value is modified in `splitEdges()`.
 * @param outPorts: number of output ports the node has; this value is modified in `splitEdges()`.
 * @param outermost: whether the node is outside of any container.
 * @param contents: symbol IDs of contained nodes.
 * @param containsTemporal: whether any contained symbols are temporal containers; used for orientation
 */
function getNode(symbolId, symbolInfo, inPorts, outPorts, outermost, contents=[], containsTemporal=false) {
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
        nodeId: symbolId,
        inPorts,
        outPorts,
        outermost,
        contents,
        orientation: containsTemporal ? "RIGHT" : "DOWN",
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
        opNodes[symbolId] = getNode(symbolId, symbolTable[symbolId], args.length + kwargs.length, viewerData.numoutputs, !container);
    }
    return {opNodes, dataOutputs, containersToCheck}
}

/**
 * Builds the edges connecting ops (concealing a graphdata), graph data nodes (if a graphdata is a leaf), and edges
 * connecting data to ops (if an op has a leaf as input).
 * @param dataOutputs
 * @param symbolTable
 * @returns {{dataNodes: {}, dataEdges: Array}}
 */
function getDataNodesAndEdges(dataOutputs, symbolTable) {
    // TODO put data nodes in containers
    // TODO put data on dataEdges
    let dataNodes = {};
    let dataEdges = [];
    Object.entries(dataOutputs).forEach(([symbolId, futureOps]) => {
        let creatorOp = symbolTable[symbolId].data.viewer.creatorop;
        let creatorPos = symbolTable[symbolId].data.viewer.creatorpos;
        if (creatorOp === null) {
            dataNodes[symbolId] = getNode(symbolId, symbolTable[symbolId], 0, futureOps.length, true);
            creatorOp = symbolId;
            creatorPos = 0;
        }
        futureOps.forEach(({opId, toPos}) => {
            dataEdges.push([creatorOp, creatorPos, opId, toPos]);
        });
    });
    return { dataNodes, dataEdges }
}

/**
 * Creates node objects for every container found while building the graph, as well as any ancestor containers they
 * might have.
 * @param containersToCheck {Array} set of container symbol IDs found while building DAG ops
 * @param symbolTable {Object}
 * @returns {{containers: Set<any>, containerNodes: {}}}
 */
function getContainerNodes(containersToCheck, symbolTable) {
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
        if (contents.length === 0) {
            continue;
        }
        let container = viewerData.container;
        if (container) {
            containersToCheck.push(container);
        }
        // We can just check the first element, since it contains either only temporal or no temporal
        containerNodes[symbolId] = getNode(symbolId, symbolTable[symbolId], 0, 0, !container, contents,
            symbolTable[contents[0]].data.viewer.temporal);
    }
    return { containers: checkedContainers, containerNodes };
}

/**
 * Helper methods for slicing DAG edges.
 */
const toInPort = (symbolId, port) => symbolId + '_i' + port;
const toOutPort = (symbolId, port) => symbolId + '_o' + port;
const containerHeight = (containerId, symbolTable) => symbolTable[containerId].data.viewer.height;

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
function linkOutputs(child, childPort, parent, slicedEdges, symbolTable, nodes) {
    let grandparent = symbolTable[parent].data.viewer.container;
    slicedEdges[grandparent].push([toOutPort(child, childPort), toOutPort(parent, nodes[parent].outPorts), parent]);
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
function linkInputs(child, childPort, parent, slicedEdges, symbolTable, nodes) {
    let grandparent = symbolTable[parent].data.viewer.container;
    slicedEdges[grandparent].push([toInPort(parent, nodes[parent].inPorts), toInPort(child, childPort), parent]);
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
    unslicedEdges.forEach(([fromId, fromPort, toId, toPort]) => {
        let fromContainer = symbolTable[fromId].data.viewer.container;
        let toContainer = symbolTable[toId].data.viewer.container;
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
                slicedEdges[fromContainer].push([toOutPort(fromId, fromPort), toInPort(toId, toPort), fromContainer]);
                break;
            }
            if (!toContainer || (fromContainer &&
                    containerHeight(toContainer, symbolTable) > containerHeight(fromContainer, symbolTable))) {
                ({
                    fromId,
                    fromPort,
                    fromContainer
                } = linkOutputs(fromId, fromPort, fromContainer, slicedEdges, symbolTable, nodes));
                continue;
            }
            if (!fromContainer || (toContainer !== null &&
                    containerHeight(toContainer, symbolTable) < containerHeight(fromContainer, symbolTable))) {
                ({toId, toPort, toContainer} = linkInputs(toId, toPort, toContainer, slicedEdges, symbolTable, nodes));
                continue;
            }
            ({
                fromId,
                fromPort,
                fromContainer
            } = linkOutputs(fromId, fromPort, fromContainer, slicedEdges, symbolTable, nodes));
            ({toId, toPort, toContainer} = linkInputs(toId, toPort, toContainer, slicedEdges, symbolTable, nodes));
        }
    });
    // Any edges that are not the child of any container become the child of the graph's root node (all nodes in an ELK
    // graph are descendants of a single root node)
    slicedEdges['root'] = slicedEdges[null];
    return slicedEdges;
}

function slicedEdgesToElk(edges, graphState) {
    return edges.filter(([fromId, toId, trueParent]) => {
        return (!graphState[trueParent] || graphState[trueParent].expanded);
    }).map(([fromId, toId]) => {
        return {id: fromId + toId, sources: [fromId], targets: [toId]};
    })
}

function getElkNode(symbolId, nodes, edges, graphState) {
    let node = nodes[symbolId];
    let children = [];
    if (graphState[symbolId].expanded) {
        // won't let me map or iterate over node.contents for some reason
        for (let i=0; i < node.contents.length; i++) {
            let childId = node.contents[i];
            children.push(getElkNode(childId, nodes, edges, graphState));
        }
    }
    let ports = [];
    for (let i=0; i < node.inPorts; i++) {
        ports.push({id: toInPort(symbolId, i),
            "properties":{
                "port.side":"NORTH",
            }});
    }
    for (let i=0; i < node.outPorts; i++) {
        ports.push({id: toOutPort(symbolId, i),
            "properties":{
                "port.side":"SOUTH",
            }});
    }
    let elkNode = {
        id: symbolId,
        properties: {'elk.direction': node.orientation},
        viewerObj: node.viewerObj,
        children,
        ports,
        edges: [],
    };

    if (node.type === 'graphcontainer' && symbolId in edges && graphState[symbolId].expanded) {
        elkNode = Object.assign(elkNode, {
            edges: slicedEdgesToElk(edges[symbolId], graphState),
        });
    }
    if (node.type === 'graphdata' || node.type === 'graphop' || !graphState[symbolId].expanded) {
        elkNode = Object.assign(elkNode, {
            height: nodeHeight,
            width: nodeWidth,
        })
    }
    return elkNode;
}

function getElkGraph(nodes, edges, graphState) {
    return {
        id: 'root',
        layoutOptions: {'elk.algorithm': 'layered', 'elk.direction': 'DOWN'},
        children: Object.entries(nodes).filter(([symbolId, node]) => node.outermost).map(([symbolId]) => getElkNode(symbolId, nodes, edges, graphState)),
        edges: slicedEdgesToElk(edges['root'], graphState),
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
            let { dataNodes, dataEdges: unslicedEdges } = getDataNodesAndEdges(dataOutputs, symbolTable);
            let { containerNodes, containers } = getContainerNodes(containersToCheck, symbolTable);

            let nodes = {
                ...opNodes,
                ...dataNodes,
                ...containerNodes,
                [headSymbolId]: getNode(headSymbolId, symbolTable[headSymbolId], 1, 0, true)
            };

            unslicedEdges.push([headViewerData.creatorop, headViewerData.creatorpos, headSymbolId, 0]);
            let edges = sliceEdges(unslicedEdges, nodes, symbolTable, containers);
            return getElkGraph(nodes, edges, graphState);
        }
    )
}