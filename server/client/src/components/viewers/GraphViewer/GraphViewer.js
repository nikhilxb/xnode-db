import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import dagre from 'dagre';
import GraphEdge from './GraphEdge.js';

const styles = theme => ({

});

const nodeHeight = 50;
const nodeWidth = 150;

/**
 * This class builds and contains all the components of a computation graph.
 */
class GraphViewer extends Component {
    constructor(props, context) {
        super(props, context);
        this.receiveNewComponent = this.receiveNewComponent.bind(this);
        this.unaddedComponents = [];
        // The number of nodes currently being loaded. The graph is rendered only when this is zero.
        this.waitingForNodes = 0;
        this.nodeIds = new Set();
        // This is not in the state, because setting state in addSymbolToDAG will cause errors (React seems to think
        // that the component sometimes isn't mounted in addSymbolToDAG, so it won't update the state and we'll get
        // errors in rendering). This isn't a real problem, unless we forsee the presence of edges changing when
        // nodeComponents doesn't; in that case, we would not trigger a re-render.
        this.edges = {};
        this.state = {
            nodeComponents: [],
        };
    }

    /**
     * Begin building the DAG from the head when the component has mounted and it's safe to update the state.
     */
    componentDidMount() {
        this.addSymbolToDAG(this.props.symbolId);
    }

    /**
     * Requests the Debugger to load a new graph component for the given symbol ID, if not already present, and adds a
     * new edge if one exists.
     */
    addSymbolToDAG(toSymbolId, fromSymbolId) {
        if (!toSymbolId) {
            return;
        }
        if (fromSymbolId && (!this.edges[fromSymbolId] || !this.edges[fromSymbolId].has(toSymbolId))) {
            console.log(fromSymbolId, toSymbolId);
            if (this.edges[fromSymbolId]) {
                this.edges[fromSymbolId].add(toSymbolId);
            } else {
                this.edges[fromSymbolId] = new Set([toSymbolId]);
            }
        }
        if (!this.nodeIds.has(toSymbolId)) {
            this.waitingForNodes += 1;
            this.nodeIds.add(toSymbolId);
            this.props.loadComponent(toSymbolId, {}, this.receiveNewComponent);
        }
    }

    /**
     * Called back when the Debugger has finished loading a new component for one of the graph's op or data nodes. If
     * the new node links to other symbols, then those symbols are requested also.
     * @param  {String} symbolId
     * @param  {Object} shellAndData
     * @param  {Component} newNodeComponent
     */
    receiveNewComponent(symbolId, shellAndData, newNodeComponent) {
        this.waitingForNodes -= 1;
        this.unaddedComponents.push(newNodeComponent);
        if (shellAndData.type == "graphop") {
            shellAndData.data.viewer.args.forEach(arg =>
                this.addSymbolToDAG(arg, symbolId)
            );
            Object.keys(shellAndData.data.viewer.kwargs).forEach(kwarg =>
                this.addSymbolToDAG(shellAndData.data.viewer.kwargs[kwarg], symbolId)
            );
        } else if (shellAndData.type == "graphdata") {
            this.addSymbolToDAG(shellAndData.data.viewer.creatorop, symbolId);
        }
        if (this.waitingForNodes == 0) {
            this.setState({
                nodeComponents: this.unaddedComponents,
            });
            this.unaddedComponents = null;
        }
    }

    /**
     * Renders all of the graph's op and data components, laid out by dagre.
     */
    render() {
        var g = new dagre.graphlib.Graph({compound: true});
        g.setGraph({});

        g.setNode('kek', {key: 'kek', label: <div style={{background: '#333', width:'100%', height:'100%'}}/>});

        // TODO containers
        this.state.nodeComponents.forEach((c, i) => {
            console.log(i);
            g.setNode(c.key, {key: c.key, label: c, width:nodeWidth, height:nodeHeight});
            if (i < 50) {
                console.log('Parented');
                g.setParent(c.key, 'kek');
            }
        });

        Object.keys(this.edges).forEach(fromSymbolId => {
            this.edges[fromSymbolId].forEach(toSymbolId => {
                g.setEdge(fromSymbolId, toSymbolId, {key: toSymbolId+fromSymbolId});
            });
        });

        dagre.layout(g);

        let graphWidth = 0;
        let graphHeight = 0;

        let nodes = g.nodes().map(v => {
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

        let edges = g.edges().map(e => {
            let edge = g.edge(e);
            return <GraphEdge key={edge.key} points={edge.points}/>;
        });

        return (
            <div style={{position: "relative", width: graphWidth, height: graphHeight}}>
                {edges}
                {nodes}
            </div>
        );
    }
}

export { nodeHeight, nodeWidth };
export default withStyles(styles)(GraphViewer);
