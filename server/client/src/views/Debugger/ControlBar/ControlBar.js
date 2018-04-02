import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { executeDebuggerCommand } from '../../../actions/controlbar';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import Tooltip    from 'material-ui/Tooltip';
import IconButton from 'material-ui/IconButton';

import ContinueIcon from './assets/continue.svg';
import StopIcon     from './assets/stop.svg';
import StepNextIcon from './assets/stepOver.svg';
import StepInIcon   from './assets/stepIn.svg';
import StepOutIcon  from './assets/stepOut.svg';


/**
 * This smart component displays the buttons used to control the debugger execution.
 */
class ControlBar extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Renders the control icon buttons in a floating horizontal toolbar.
     */
    render() {
        const { classes, executeDebuggerCommand } = this.props;

        return (
            <div className={classes.container}>
                <div className={classes.controls}>
                    <Tooltip title="Continue">
                        <IconButton aria-label="Continue"
                                    onClick={() => executeDebuggerCommand('continue')}>
                            <img src={ContinueIcon}/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Step Next">
                        <IconButton aria-label="Step Next"
                                    onClick={() => executeDebuggerCommand('step_over')}>
                            <img src={StepNextIcon}/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Step In">
                        <IconButton aria-label="Step In"
                                    onClick={() => executeDebuggerCommand('step_into')}>
                            <img src={StepInIcon}/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Step Out">
                        <IconButton aria-label="Step Out"
                                    onClick={() => executeDebuggerCommand('step_out')}>
                           <img src={StepOutIcon}/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Stop">
                        <IconButton aria-label="Stop"
                                    onClick={() => executeDebuggerCommand('stop')}>
                            <img src={StopIcon}/>
                        </IconButton>
                    </Tooltip>
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
        display: 'block',
    },
    controls: {
        maxWidth: 300,
        margin: `${theme.spacing.unit}px auto`,
    },
    paper: {
        padding: 2,
    },
});


// To inject application state into component
// ------------------------------------------

/** Connects application state objects to component props. */
function mapStateToProps(state, props) {
    return {

    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        executeDebuggerCommand,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ControlBar));
