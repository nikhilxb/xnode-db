import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import { withStyles } from 'material-ui/styles';

import ViewerFrame  from '../../../components/ViewerFrame';
import NumberViewer from '../../../components/viewers/NumberViewer';
import StringViewer from '../../../components/viewers/StringViewer';
import GraphViewer  from '../../../components/viewers/GraphViewer';


/**
 * This smart component serves as an interactive workspace for inspecting variable viewers. It displays in sequence
 * a list of `[*]Viewer` objects (each instantiated within a `Frame`).
 */
class Canvas extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
        viewers: PropTypes.object.isRequired,
        viewerPositions: PropTypes.array.isRequired,
    };

    /**
     * Returns the [*]Viewer component of the proper type for the given viewer data object.
     */
    createViewerComponent(viewerId, viewer) {
        switch(viewer.type) {
            case "number":
                return <NumberViewer/>;
            case "str":
                return <StringViewer/>;
            case "graphdata":
                return <GraphViewer symbolId={viewer.symbolId} viewerId={viewerId}/>;
            // TODO: Add more viewers
        }
    }

    /**
     * Renders the inspector canvas and any viewers currently registered to it.
     */
    render() {
        const { classes, viewers, viewerPositions } = this.props;

        let framedViewers = viewerPositions.map((viewerId) => {
            let viewer = viewers[viewerId];
            return (
                <div className={classes.frameContainer}>
                    <ViewerFrame key={viewer.viewerId}
                                 viewerId={viewer.viewerId}
                                 type={viewer.type}
                                 name={viewer.name}>
                        {this.createViewerComponent(viewerId, viewer)}
                    </ViewerFrame>
                </div>
            );
        });

        return (
            <div className={classes.canvasContainer}>
                {framedViewers}
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
        padding: theme.spacing.unit * 4,
    },
    frameContainer: {
        display: "block",
    }
});

// To inject application state into component
// ------------------------------------------

/**
 * Derived data structure for `viewers`: [
 *     {
 *         symbolId: "@id:12345",
 *         viewerId: 0,
 *         type: "number",
 *         name: "myInt",
 *         str:  "86",
 *         payload: {}
 *     }
 * ]
 */
const viewersSelector = createSelector(
    [(state) => state.canvas.viewers, (state) => state.symboltable],
    (viewers, symboltable) => {
        let newViewers = {};
        Object.entries(viewers).forEach(([viewerId, viewer]) => {
            let symbol = symboltable[viewer.symbolId];
            newViewers[viewerId] = {
                ...viewer,
                "type": symbol.type,
                "name": symbol.name,
                "str": symbol.str,
                "payload": symbol.data.viewer,
            };
        });
        return newViewers;
    }
);

/** Connects application state objects to component props. */
function mapStateToProps(state, props) {
    return {
        viewers: viewersSelector(state),
        viewerPositions: state.canvas.viewerPositions,
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        // propName: doSomethingAction,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Canvas));

