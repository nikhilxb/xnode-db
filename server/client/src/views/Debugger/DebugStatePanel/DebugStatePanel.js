import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import List from 'material-ui/List';
import Collapse from 'material-ui/transitions/Collapse';
import Typography from 'material-ui/Typography';
import ColorGreen from 'material-ui/colors/green';
import ColorYellow from 'material-ui/colors/amber';
import ColorRed from 'material-ui/colors/red';

import ControlBar from '../ControlBar/index';


/**
 * This smart component displays information about the Python program's current execution state.
 */
class DebugStatePanel extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,

        programState: PropTypes.string.isRequired,
        stackFrame: PropTypes.array,
    };

    /**
     * Builds the component which describes a single frame in the stack. These components are arranged vertically, with
     * the top-most being the top of the stack.
     * @param classes: the CSS classes to be used.
     * @param frame: the frame object, taken from the `stackFrame` prop, which is mapped from the Redux store.
     * @param key: a string unique among all other frame components.
     * @returns a component to be rendered.
     */
    buildFrameComponent(classes, frame, key) {
        const { functionName, args, returningTo, lineNo, fileName } = frame;
        return (
          <Typography className={classes.frame} key={key}>
              <span>{"in "}</span>
              <span className={classes.monospace}>{`${functionName}${args}`}</span>
              <span className={classes.monospace}>{returningTo ? `-> ${returningTo}` : ''}</span>
              <span>{`at line ${lineNo} in `}</span>
              <span className={classes.monospace}>{`${fileName}`}</span>
          </Typography>
        );
    }

    /**
     * Builds the component which describes the program's current state, including the full stack frame, as well as the
     * control bar to manipulate program state.
     * @param classes: the CSS classes to be used.
     * @param stackFrame: a list of frame objects; typically pulled directly from the Redux store, at
     *      `program.stackFrame`.
     * @param programState: a string representing whether the Python program is "running", "waiting", or "disconnected."
     * @returns a component to be rendered above the variable list.
     */
    buildStackComponent(classes, stackFrame, programState) {
        let statusComponent = null;
        let topFrame = null;
        let additionalFrames = null;
        if (stackFrame) {
            statusComponent = (
                <Typography variant="body" className={classes.waiting}>
                    {'Paused at breakpoint'}
                </Typography>
            );
            topFrame = this.buildFrameComponent(classes, stackFrame[0], 0);
            additionalFrames = stackFrame.slice(1).map((frame, i) => this.buildFrameComponent(classes, frame, i + 1));
        }
        else if (programState === 'running'){
            statusComponent = (
                <Typography variant="body" className={classes.running}>
                    {'Running'}
                </Typography>
            );
        }
        else {
            statusComponent = (
                <Typography variant="body" className={classes.disconnected}>
                    {'Disconnected'}
                </Typography>
            );
        }

        // TODO collapse and expand the stack frame
        return (
            <div className={classes.root} >
                {statusComponent}
                {topFrame}
                <Collapse in={true} timeout={50}>
                    <List classes={{dense: classes.list}} dense disablePadding>
                        {additionalFrames}
                    </List>
                </Collapse>
                {programState === 'waiting' ? <ControlBar /> : null}
            </div>
        );
    }


    /**
     * Renders a description of the stack frame, including a program status message (at breakpoint or executing) and
     * strings describing the stack frame, arranged vertically. Also includes the `ControlBar` component below the stack
     * frame strings.
     */
    render() {
        const { classes, stackFrame, programState } = this.props;
        return this.buildStackComponent(classes, stackFrame, programState);
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    root: {
        textAlign: 'center',
    },
    waiting: {
        backgroundColor: ColorGreen[200],
        color: 'black',
        padding: 8,
        marginBottom: 8,
    },
    running: {
        backgroundColor: ColorYellow[200],
        color: 'black',
        padding: 8,
    },
    disconnected: {
        backgroundColor: ColorRed[200],
        color: 'black',
        padding: 8,
    },
    monospace: {
        fontFamily: theme.typography.monospace.fontFamily,
    },
    frame: {
        fontSize: '1.2rem',
    }
});


// To inject application state into component
// ------------------------------------------

/** Connects application state objects to component props. */
function mapStateToProps(state) {
    return {
        programState: state.program.programState,
        stackFrame: state.program.stackFrame,
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({

    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(DebugStatePanel));
