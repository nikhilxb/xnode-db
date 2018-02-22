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

    //    let viewers = this.state.viewers;
    //    viewers.push(<DataViewer key={"1766992443720"} symbolId={"1766992443720"} loadSymbol={this.props.loadSymbol} isTopLevel={true} />)

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Renders the inspector canvas and any viewers currently registered to it.
     */
    render() {
        const { classes, viewers } = this.props;

        let framedViewers = viewers.map((viewer, viewerId) => {
            return (
                <ViewerFrame title={"Title Goes Here"}>
                    {viewer}
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
 *         type: "number",
 *     }
 * ]
 */
const viewersSelector = createSelector(
    [(state) => state.canvas, (state) => state.symboltable],
    (canvas, symboltable) => {
        canvas.map(viewer => {
            if(symboltable[viewer.symbolId])
                viewer.set("type", symboltable[viewer.symbolId].type);
        });
    }
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

