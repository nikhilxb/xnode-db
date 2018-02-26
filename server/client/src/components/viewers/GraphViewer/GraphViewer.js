import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import dagre from 'dagre';
import GraphEdge from './GraphEdge.js';
import { bindActionCreators } from 'redux';
import {ensureGraphLoadedActionThunk} from "../../../actions/symboltable";
import {connect} from "react-redux";
import GraphDataViewer from './GraphDataViewer.js';
import GraphOpViewer from './GraphOpViewer.js';
import {createSelector} from "reselect";

const styles = theme => ({

});

const nodeHeight = 50;
const nodeWidth = 150;

/**
 * This class builds and contains all the components of a computation graph.
 */
class GraphViewer extends Component {
    componentDidMount() {
        this.props.ensureGraphLoaded(this.props.symbolId, this.props.viewerId);
    }

    /**
     * Renders all of the graph's op and data components, laid out by dagre.
     */
    render() {
        let { nodes, edges } = this.props.graph;
        let nodeComponents = nodes.map(node => {
            if (node.type === 'graphdata') {
                return <GraphDataViewer key={node.symbolId} {...node} />;
            }
            else {
                return <GraphOpViewer key={node.symbolId} {...node} />;
            }
        });

        let g = new dagre.graphlib.Graph({compound: true});
        g.setGraph({});

        // TODO containers
        nodeComponents.forEach((c, i) => {
            g.setNode(c.key, {key: c.key, label: c, width:nodeWidth, height:nodeHeight});
        });

        edges.forEach(([fromSymbolId, toSymbolId]) => {
            g.setEdge(fromSymbolId, toSymbolId, {key: toSymbolId+fromSymbolId});
        });

        dagre.layout(g);

        let graphWidth = 0;
        let graphHeight = 0;

        let nodesToRender = g.nodes().map(v => {
            let node = g.node(v);
            if (node.key === 'kek') {
                console.log(node.x, node.y, node.width, node.height);
            }
            graphWidth = Math.max(graphWidth, node.x + node.width/2);
            graphHeight = Math.max(graphHeight, node.y + node.height/2);
            return (
                <div key={node.key} style={{position: "absolute", top: node.y - node.height/2, left: node.x - node.width/2, width:node.width, height:node.height}}>
                    {node.label}
                </div>
            );
        });

        let edgesToRender = g.edges().map(e => {
            let edge = g.edge(e);
            return <GraphEdge key={edge.key} points={edge.points}/>;
        });

        return (
            <div style={{position: "relative", width: graphWidth, height: graphHeight}}>
                {edgesToRender}
                {nodesToRender}
            </div>
        );
    }
}

const getSymbolId = (state, props) => props.symbolId;

const getSymbolTable = (state) => state.symboltable;

const getHasLoadedGraph = (state, props) => state.canvas.viewerObjects[props.viewerId].hasLoaded;

function makeGetGraphFromHead() {
    return createSelector(
        [ getHasLoadedGraph, getSymbolId, getSymbolTable ],
        (hasLoadedGraph, symbolId, symbolTable) => {
            if (!hasLoadedGraph) {
                return {
                    nodes: [],
                    edges: [],
                }
            }
            let nodes = [];
            let edges = [];
            let checked = new Set();
            let toCheck = [symbolId];
            while (toCheck.length > 0) {
                let nodeId = toCheck.pop();
                if (checked.has(nodeId)) {
                    continue;
                }
                checked.add(nodeId);
                let symbolInfo = symbolTable[nodeId];
                nodes.push({
                    ...symbolInfo,
                    symbolId: nodeId,
                });
                if (symbolInfo.type === 'graphdata') {
                    if (symbolInfo.data.viewer.creatorop !== null) {
                        toCheck.push(symbolInfo.data.viewer.creatorop);
                        edges.push([symbolInfo.data.viewer.creatorop, nodeId]);
                    }
                }
                if (symbolInfo.type === 'graphop') {
                    symbolInfo.data.viewer.args.filter(arg => arg !== null).forEach(arg => {
                            edges.push([arg, nodeId]);
                            toCheck.push(arg);
                        }
                    );
                    Object.values(symbolInfo.data.viewer.kwargs).forEach(kwarg => {
                            toCheck.push(kwarg);
                            edges.push([kwarg, nodeId]);
                        }
                    );
                }
            }
            return {
                nodes,
                edges,
            }
        }
    )
}

// Inject styles and data into component
function makeMapStateToProps() {
    const getGraphFromHead = makeGetGraphFromHead();
    return (state, props) => {
        return {
            graph: getGraphFromHead(state, props),
        }
    }
}
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        ensureGraphLoaded: ensureGraphLoadedActionThunk,
    }, dispatch);
}

export { nodeHeight, nodeWidth };
export default connect(makeMapStateToProps, mapDispatchToProps)(withStyles(styles)(GraphViewer));
