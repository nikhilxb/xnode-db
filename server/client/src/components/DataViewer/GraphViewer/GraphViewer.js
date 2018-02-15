import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import DataViewer from '../DataViewer.js';
import dagre from 'dagre';
import GraphEdge from './GraphEdge.js';

const styles = theme => ({
});

const nodeHeight = 75;
const nodeWidth = 100;

/**
 * This class builds and contains all the components of a computation graph.
 */
class GraphViewer extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            nodeIds: new Set(),
            nodeComponents: [],
            edges: [],
        }
    }

    componentDidMount() {
        console.log('Graph head mounted.');
        this.addSymbolToDAG(this.props.symbolId);
    }

    /**
     * Adds the symbol with ID toSymbolId to the graph, if not already present. If added, the new symbol will call this
     * function again for each node it links to.
     */
    addSymbolToDAG(toSymbolId, fromSymbolId=null) {
        if (toSymbolId === null) {
            return;
        }
        let nodeIds = this.state.nodeIds;
        console.log('Trying to build DAG from ' + toSymbolId);
        if (!nodeIds.has(toSymbolId)) {
            console.log('Adding ' + toSymbolId);
            nodeIds.add(toSymbolId);
            let edges = this.state.edges;
            if (fromSymbolId !== null) {
                let newEdge = {source: fromSymbolId, target: toSymbolId};
                edges.push(newEdge);
            }
            let nodeComponents = this.state.nodeComponents;
            let newDataViewer = <DataViewer key={toSymbolId} symbolId={toSymbolId} addToDAG={(to, from)=>this.addSymbolToDAG(to, from)} loadSymbol={this.props.loadSymbol} />;
            nodeComponents.push(newDataViewer);
            this.setState({
                nodeIds: nodeIds,
                edges: edges,
                nodeComponents: nodeComponents,
            });
        }
    }

    /**
     * Renders all of the graph's op and data components, laid out by dagre.
     */
    render() {
        var g = new dagre.graphlib.Graph({compound: true});
        g.setGraph({});

        // TODO containers
        // TODO link this width to the width in GraphOpViewer and GraphDataViewer
        this.state.nodeComponents.forEach(c => {
            g.setNode(c.key, {label: c, width:nodeWidth, height:nodeHeight})
        });
        this.state.edges.forEach(edge =>
            g.setEdge(edge.source, edge.target, {})
        );

        dagre.layout(g);

        let nodes = g.nodes().map(v => {
            let node = g.node(v);
            return (
                <div style={{position: "absolute", top: node.y - node.height/2, left: node.x - node.width/2}}>
                    {node.label}
                </div>
            );
        });

        let edges = g.edges().map(e => {
            let edge = g.edge(e);
            return <GraphEdge points={edge.points}/>;
        });

        return (
            <div>
                {nodes}
                {edges}
            </div>
        );
    }
}

export { nodeHeight, nodeWidth };
export default withStyles(styles)(GraphViewer);
