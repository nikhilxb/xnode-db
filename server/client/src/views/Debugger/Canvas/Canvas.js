import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import { withStyles } from 'material-ui/styles';

import GridLayout, { WidthProvider } from 'react-grid-layout';

import ViewerFrame  from '../../../components/ViewerFrame';
import NumberViewer from '../../../components/viewers/NumberViewer';
import StringViewer from '../../../components/viewers/StringViewer';
import TensorViewer from '../../../components/viewers/TensorViewer';
import GraphViewer  from '../../../components/viewers/GraphViewer';
import ListViewer  from '../../../components/viewers/ListViewer';

import { addViewerActionThunk, removeViewerAction, updateLayoutAction } from "../../../actions/canvas";


const FlexibleGridLayout = WidthProvider(GridLayout);

/**
 * This smart component serves as an interactive workspace for inspecting variable viewers. It displays in sequence
 * a list of `[*]Viewer` objects (each instantiated within a `Frame`).
 */
class Canvas extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Returns the [*]Viewer component of the proper type for the given viewer data object.
     */
    createViewerComponent(viewer) {
        const props = {
            symbolId: viewer.symbolId,
            viewerId: viewer.viewerId,
            payload: viewer.payload,
            str: viewer.str,
        };

        switch(viewer.type) {
            case "number":
                return <NumberViewer {...props}/>;
            case "string":
                return <StringViewer {...props}/>;
            case "tensor":
                return <TensorViewer {...props}/>;
            case "graphdata":
                return <GraphViewer {...props}/>;
            case "list":
            case "tuple":
            case "set":
                return <ListViewer {...props}/>;
            default:
                return null;
            // TODO: Add more viewers
        }
    }

    /**
     * Renders the inspector canvas and any viewers currently registered to it.
     */
    render() {
        const { classes, viewers, removeViewerFn, layout, updateLayoutFn } = this.props;
        let frames = viewers.map((viewer) => {
            return (
                <div key={viewer.viewerId} className={classes.frameContainer}>
                    <ViewerFrame key={viewer.viewerId}
                                 viewerId={viewer.viewerId}
                                 type={viewer.type}
                                 name={viewer.name}
                                 removeViewerFn={removeViewerFn}>
                        {this.createViewerComponent(viewer, viewer)}
                    </ViewerFrame>
                </div>
            )
        });

        return (
            <div className={classes.canvasContainer}>
                <FlexibleGridLayout layout={layout} cols={12} rowHeight={50} autoSize={true}
                                    onLayoutChange={updateLayoutFn}>
                    {frames}
                </FlexibleGridLayout>
            </div>
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    canvasContainer: {
        flexGrow: 1,
        margin: theme.spacing.unit * 4,
        overflow: 'auto',
    },
    frameContainer: {
        display: "block",
    }
});


// To inject application state into component
// ------------------------------------------

/**
 * Creates derived data structure for `viewers`: [
 *     {
 *         symbolId: "@id:12345",
 *         viewerId: 0,
 *         type: "number",
 *         name: "myInt",
 *         str:  "86",
 *         payload: {...}
 *     }
 * ]
 */
const viewersSelector = createSelector(
    [(state) => state.canvas.viewerObjects, (state) => state.canvas.viewerPositions, (state) => state.program.symbolTable],
    (viewerObjects, viewerPositions, symbolTable) => {
        return viewerPositions.map((viewerPosition) => {
            let viewerId = parseInt(viewerPosition.i);
            let viewerObj = viewerObjects[viewerId];
            let symbol = symbolTable[viewerObj.symbolId];
            return {
                symbolId: viewerObj.symbolId,
                viewerId: viewerId,
                type:     symbol.type,
                name:     symbol.name,
                str:      symbol.str,
                payload:  viewerObj.payload.merge(symbol.data && symbol.data.viewer),  // TODO: Why this?
            };
        });
    }
);

/** Connects application state objects to component props. */
function mapStateToProps(state, props) {
    return {
        viewers: viewersSelector(state),
        layout:  state.canvas.viewerPositions,
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        addViewerFn:    addViewerActionThunk,
        removeViewerFn: removeViewerAction,
        updateLayoutFn: updateLayoutAction,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Canvas));

