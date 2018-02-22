import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from 'reselect';
import { withStyles } from 'material-ui/styles';
import ViewerFrame from '../../../components/viewers/ViewerFrame.js';


/**
 * This smart component serves as an interactive workspace for inspecting variable viewers. It displays in sequence
 * a list of `[*]Viewer` objects (each instantiated within a `Frame`).
 */
class Canvas extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
        viewers: PropTypes.array.isRequired,
    };

    /**
     * Returns the [*]Viewer component of the proper type for the given viewer data object.
     */
    createViewerComponent(viewer) {
        switch(viewer.type) {
            case "number":
                return <NumberViewer/>;
                // TODO: Add more viewers
        }
    }

    /**
     * Renders the inspector canvas and any viewers currently registered to it.
     */
    render() {
        const { classes, viewers } = this.props;

        let framedViewers = viewers.map((viewer, i) => {
            return (
                <ViewerFrame key={i} title={"Title Goes Here"}>
                    {this.createViewerComponent(viewer)}
                </ViewerFrame>
            );
        });

        return (
            <div className={classes.container}>
                {framedViewers}
            </div>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    container: {
        flexGrow: 1,
        padding: theme.spacing.unit * 4,
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
 *         viewer: {}
 *     }
 * ]
 */
const viewersSelector = createSelector(
    [(state) => state.canvas, (state) => state.symboltable],
    (canvas, symboltable) => canvas.map(viewer => {
        return viewer.set("type", symboltable[viewer.symbolId].type)
                     .set("name", symboltable[viewer.symbolId].name).
                     .set("")
    })
);

/** Connects application state objects to component props. */
function mapStateToProps(state, props) {
    return {
        viewers: viewersSelector(state),
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        // propName: doSomethingAction,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Canvas));

