import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withStyles } from 'material-ui/styles';
import { createSelector } from "reselect";
import ELK from 'elkjs';

import { ensureGraphLoadedActionThunk } from "../../../actions/symboltable";
import { setInViewerPayloadAction } from '../../../actions/canvas';
import { makeGetElkGraphFromHead, layoutGraph } from "./layout";

import GraphOpNode from './GraphOpNode';
import GraphDataEdge from './GraphDataEdge';
import GraphDataNode from './GraphDataNode';
import GraphContainerNode from './GraphContainerNode';

import { CircularProgress } from 'material-ui/Progress';


/**
 * This smart component builds and contains all the components of a computation graph.
 * The `payload` prop:
 * {
 *      graphState: {
 *          symbolId: {
 *              expanded: false,
 *          }
 *      },
 *      graph: {
 *          id: 'root',
 *          children: [{...}, {...}],
 *          edges: [{...}, {...}],
 *      },
 *      stateChanged: false,
 *      graphLoaded: false,
 * }
 */
class GraphViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            selectedId: null,
            hoverId: null,
        }
        this.setSelectedId = this.setSelectedId.bind(this);
        this.setHoverId = this.setHoverId.bind(this);
    }

    componentDidMount() {
        let { ensureGraphLoaded, symbolId, viewerId } = this.props;
        ensureGraphLoaded(symbolId, viewerId);
    }

    /**
     * If the viewer is receiving new nodes or edges (generated by `makeGetElkGraphFromHead()`), then it lays out the graph
     * in a promise and updates the Redux store when complete.
     *
     * @param nextProps
     */
    componentWillReceiveProps(nextProps) {
        let { graphSkeleton, viewerId, setInPayload } = this.props;
        let { graphSkeleton: nextGraphSkeleton } = nextProps;
        let { stateChanged } = nextProps.payload;
        if (nextGraphSkeleton && (!graphSkeleton || stateChanged)) {
            setInPayload(viewerId, ['stateChanged'], false);
            let elk = new ELK();
            layoutGraph(elk, nextGraphSkeleton, viewerId, setInPayload);
            this.setState({
                selectedId: null,
                hoverId: null,
            });
        }
    }

    setSelectedId(symbolId) {
        this.setState({
            selectedId: symbolId,
        });
    }

    setHoverId(symbolId) {
        this.setState({
            hoverId: symbolId,
        });
    }

    /**
     * Recursively adds new `GraphDataEdge` components to the `components` array.
     *
     * @param elkNode
     *     An ELK node object which contains at least `x` and `y` fields, as well as an array of edge objects. Each
     *     edge has a list of source port ids (of length exactly one) and a list of target port ids (also of length
     *     exactly one). Note that node ids (different from port ids) are of the form
     *         [0-9]?{symbolId}
     *     where the leading digit is only added if the same symbol appears in multiple nodes (like if it is a leaf
     *     in multiple temporal containers). A port id is of the form
     *         {nodeId}_{portNumber}
     *     The edge also contains an array `sections`, also of length exactly one (ELK supports hyperedges, hence
     *     why everything is a list). This section object has a start point and an end point, as well as an array
     *     of bend points, indicating points the final edge should pass through.
     * @param components
     *     The list to which new edge components should be added.
     * @param offset
     *     The position offset at which new edges should be rendered. Edge positions are relative, so we must
     *     maintain an offset value to position them globally. Edges aren't just offset from their parent node,
     *     however. An edge is stored in the node which is the first common ancestor of the edge's source and its
     *     target. For edges that connect a container to one of its children, this means that only the container is
     *     in `elkNode`'s children, while the target is stored in the container's node  object. In this case, the
     *     edge is offset not by `elkNode`'s position, but by the position of the container node.
     */
    buildEdgeComponents(edges) {
        return edges.map(edge => {
            const layoutObj = {
                setSelectedId: this.setSelectedId,
                setHoverId: this.setHoverId,
                selectedId: this.state.selectedId,
                hoverId: this.state.hoverId,
            };
            return ({
                component: <GraphDataEdge {...edge} {...layoutObj} />,
                zOrder: edge.zOrder,
            });
        });
    }

    /**
     * Recursively builds node components and adds them to `components`.
     *
     * @param elkNode
     *     A node in the ELK graph, containing a (possibly empty) list of child nodes as well as `width`, `height`,
     *     `x`, `y`, and `viewerObj` fields. `viewerObj` contains the properties needed to render the node (type,
     *     name, str, symbolId, and data.viewer).
     * @param components
     *     The array to which node components should be added.
     * @param offset
     *     The pixel offset at which the component should be rendered. ELK uses relative positioning, meaning that a
     *     node's global position should be equal to its parent's global position, plus the node's `x` and `y` values.
     */
    buildNodeComponents(nodes) {
        const { payload } = this.props;
        return nodes.map(node => {
            const { type, key, viewerObj, x, y, width, height, zOrder } = node;
            const layoutObj = {
                width,
                height,
                x,
                y,
                setSelectedId: this.setSelectedId,
                setHoverId: this.setHoverId,
                selectedId: this.state.selectedId,
                hoverId: this.state.hoverId,
                isExpanded: payload.graphState[symbolId].expanded,
            };
            switch(type) {
                case 'graphdata':
                    return ({
                        component: <GraphDataNode key={key} {...viewerObj} {...layoutObj} />,
                        zOrder,
                    });

                case 'graphop':
                    return ({
                        component: <GraphOpNode key={key} {...viewerObj} {...layoutObj} />,
                        zOrder,
                    });

                case 'graphcontainer':
                    return ({
                        component: <GraphContainerNode key={key} {...viewerObj} {...layoutObj}
                                                       toggleExpanded={() => this.toggleExpanded(viewerObj.symbolId)} />,
                        zOrder,
                    });
            }
        });
    }

    toggleExpanded(symbolId) {
        let { setInPayload, viewerId, expansibleSymbols } = this.props;
        if (!expansibleSymbols.has(symbolId)) {
            return;
        }
        let { expanded } = this.props.payload.graphState[symbolId];
        setInPayload(viewerId, ['graphState', symbolId, 'expanded'], !expanded);
        setInPayload(viewerId, ['stateChanged'], true);
    }

    /**
     * Renders all of the graph's op and data components, laid out by ELK.
     */
    render() {
        let { graph } = this.props.payload;
        if (!graph) {
            return <CircularProgress />;
        }
        const componentObjects = this.buildNodeComponents(graph.nodes).concat(this.buildEdgeComponents(graph.edges));
        const components = componentObjects.asMutable().sort(({zOrder: zOrder1}, {zOrder: zOrder2}) => zOrder1 - zOrder2).map(({component}) => component);

        return (
            <svg width={graph.width} height={graph.height}>
                <rect x={0} y={0} width={graph.width} height={graph.height} fill="transparent"
                      onClick={() => this.setSelectedId(null)}/>
                {components}
            </svg>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    // css-key: value,
});

// To inject application state into component
// ------------------------------------------

const getExpansibleSymbols = createSelector(
    [
        (state) => state.symboltable
    ],
    (symbolTable) => {
        let expansibleSymbols = new Set();
        Object.entries(symbolTable).forEach(([symbolId, symbolInfo]) => {
            if (symbolInfo.type === 'graphcontainer' && symbolInfo.data && symbolInfo.data.viewer.temporalstep === -1) {
                expansibleSymbols.add(symbolId);
            }
        });
        return expansibleSymbols;
    }
);

/** Connects application state objects to component props. */
function makeMapStateToProps() {
    const getGraphFromHead = makeGetElkGraphFromHead();
    return (state, props) => {
        return {
            graphSkeleton: getGraphFromHead(state, props),
            expansibleSymbols: getExpansibleSymbols(state),
        }
    }
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        ensureGraphLoaded: ensureGraphLoadedActionThunk,
        setInPayload: setInViewerPayloadAction,
    }, dispatch);
}

export default connect(makeMapStateToProps, mapDispatchToProps)(withStyles(styles)(GraphViewer));
