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
import GraphDataViewer from './GraphDataViewer';

import Tooltip from '../../Tooltip';
import Typography from 'material-ui/Typography';
import { CircularProgress } from 'material-ui/Progress';
import ColorGrey from 'material-ui/colors/grey';
import ColorBlue from "material-ui/colors/blue";


/**
 * This smart component builds and contains all the components of a computation graph.
 * The `payload` prop:
 * {
 *      graphState: {
 *          symbolId: {
 *              expanded: false,
 *          },
 *          ...
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
        classes:            PropTypes.object.isRequired,
        graphSkeleton:      PropTypes.object,
        ensureGraphLoaded:  PropTypes.func.isRequired,
        setInPayload:       PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            selectedObj: null,  // {type, symbolId, ...} or null
            hoverObj: null,     // {type, , ...} or null
            isInspectorExpanded: true,
        };
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
                selectedObj: null,
                hoverObj: null,
            });
        }
    }

    setSelectedObj(obj) {
        this.setState({
            selectedObj: obj,
        });
    }

    setHoverObj(obj, isHovered) {
        this.setState({
            hoverObj: isHovered ? obj : null,
        });
    }

    toggleInspectorExpanded() {
        this.setState(prev => ({
            isInspectorExpanded: !prev.isInspectorExpanded,
        }));
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
            const { key, points, zOrder, isTemporal, viewerObj, sourceSymbolId, targetSymbolId, argName } = edge;
            const tooltipObj = {
                ...viewerObj,
            };
            const layoutObj = {
                points,
                zOrder,
                isTemporal,
                sourceSymbolId,
                targetSymbolId,
                argName,
                setSelected:    this.setSelectedObj.bind(this, tooltipObj),
                setHover:       this.setHoverObj.bind(this, tooltipObj),
                selectedId:     this.state.selectedObj && this.state.selectedObj.symbolId,
                hoverId:        this.state.hoverObj && this.state.hoverObj.symbolId,
            };
            return ({
                component: <GraphDataEdge key={key} {...viewerObj} {...layoutObj} />,
                zOrder,
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
        return nodes.map(node => {
            const { type, key, viewerObj, x, y, width, height, zOrder, isTemporal, isExpanded } = node;
            const layoutProps = {
                width,
                height,
                x,
                y,
                isTemporal,
                isExpanded,
            };
            const interactionProps = {
                setSelected:    this.setSelectedObj.bind(this, viewerObj),
                setHover:       this.setHoverObj.bind(this, viewerObj),
                selectedId:     this.state.selectedObj && this.state.selectedObj.symbolId,
                hoverId:        this.state.hoverObj && this.state.hoverObj.symbolId,
            };

            switch(type) {
                case 'graphdata':
                    return ({
                        component: <GraphDataNode key={key} {...viewerObj} {...layoutProps} {...interactionProps} />,
                        zOrder,
                    });

                case 'graphop':
                    return ({
                        component: <GraphOpNode key={key} {...viewerObj} {...layoutProps} {...interactionProps}/>,
                        zOrder,
                    });

                case 'graphcontainer':
                    return ({
                        component: <GraphContainerNode key={key} {...viewerObj} {...layoutProps} {...interactionProps}
                                                       toggleExpanded={() => this.toggleExpanded(viewerObj.symbolId)} />,
                        zOrder,
                    });
            }
        });
    }

    buildInspectorComponents(classes, type, args, kwargs) {

        let arr = [];
        if(type !== undefined) {
            arr.push(
                <Typography className={classes.label} variant="caption">Type</Typography>,
                <span>{type ? type : <br/>}</span>
            );
        }
        if(args !== undefined) {
            arr.push( <Typography className={classes.label} variant="caption">Args</Typography> );
            if(!args) {
                arr.push( <span className={classes.monospace}>{<br/>}</span> );
            } else {
                args.forEach((argArr) => {
                    console.log(argArr);
                    const [ argName, argVal ] = argArr;
                    arr.push( <span className={classes.monospace}>{`${argName}: ${argVal}`}</span> );
                });
            }
        }
        return arr;
    };

    toggleExpanded(symbolId) {
        let { setInPayload, viewerId } = this.props;
        let { expanded } = this.props.payload.graphState[symbolId];
        setInPayload(viewerId, ['graphState', symbolId, 'expanded'], !expanded);
        setInPayload(viewerId, ['stateChanged'], true);
    }

    /**
     * Renders all of the graph's op and data components, laid out by ELK. Additionally, displays an inspector fixed to
     * the bottom of the frame that displays the hover/selected item's info.
     */
    render() {
        const { classes, payload } = this.props;
        const { graph } = payload;
        if (!graph) {
            return (
                <div className={classes.container}>
                    <div className={classes.progress}>
                        <CircularProgress />
                    </div>
                </div>
            );
        }

        let graphComponents = this.buildNodeComponents(graph.nodes).concat(this.buildEdgeComponents(graph.edges));
        graphComponents = graphComponents.asMutable().sort(({zOrder: z1}, {zOrder: z2}) => z1 - z2).map(({component}) => component);

        const inspectorObj = this.state.hoverObj || this.state.selectedObj;
        let inspectorComponents;
        if(!inspectorObj) {
            inspectorComponents = this.buildInspectorComponents(classes, null);
        } else {
            const { type, name } = inspectorObj;
            inspectorComponents = this.buildInspectorComponents(classes, type, [["arg1", "herro"], ["arg2", "hihi"]]);
        }

        let buildArrowheadMarker = (id, color) => (
            <marker id={id} viewBox="-5 -3 5 6" refX="0" refY="0"
                    markerUnits="strokeWidth" markerWidth="4" markerHeight="3" orient="auto">
                <path d="M 0 0 l 0 1 a 32 32 0 0 0 -5 2 l 1.5 -3 l -1.5 -3 a 32 32 0 0 0 5 2 l 0 1 z" fill={color} />
            </marker>
        );

        return (
            <div className={classes.container}>
                <div className={classes.graph}>
                    <svg width={graph.width} height={graph.height}>
                        <defs>
                            {buildArrowheadMarker("arrowheadGrey", ColorGrey[600])}
                            {buildArrowheadMarker("arrowheadBlue", ColorBlue[600])}
                        </defs>
                        <rect x={0} y={0} width={graph.width} height={graph.height} fill="transparent"
                              onClick={() => this.setSelectedObj(null)}/>
                        {graphComponents}
                    </svg>
                </div>
                <div className={classes.inspector}>
                    {inspectorComponents}
                </div>
            </div>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    container: {
        flex: 1,  // expand to fill frame vertical

        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',  // along main axis (horizontal)
        alignItems: 'stretch',  // along cross axis (vertical)
        overflow: 'hidden',
    },
    progress: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
    },
    graph: {
        flex: 'auto',
        overflow: 'auto',
        textAlign: 'left', // so SVG doesn't move
    },
    inspector: {
        flex: 'initial',
        minWidth: 150,
        overflow: 'auto',

        boxSizing: 'border-box',
        padding: '4px 12px',
        backgroundColor: ColorGrey[50],
        borderLeftWidth: 1,
        borderLeftStyle: 'solid',
        borderLeftColor: ColorGrey[200],
        fontSize: '9pt',
        textAlign: 'left',

        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
    },
    label: {
        paddingTop: 8,
    },
    monospace: {
        fontFamily: theme.typography.monospace.fontFamily,
    },
});

// To inject application state into component
// ------------------------------------------

/** Connects application state objects to component props. */
function makeMapStateToProps() {
    const getGraphFromHead = makeGetElkGraphFromHead();
    return (state, props) => {
        return {
            graphSkeleton: getGraphFromHead(state, props),
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