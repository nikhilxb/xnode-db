import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import { executeDebuggerCommand } from '../../../actions/controlbar';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import Paper      from 'material-ui/Paper';
import Tooltip    from 'material-ui/Tooltip';
import IconButton from 'material-ui/IconButton';

import ContinueIcon from 'material-ui-icons/PlayArrow';
import StopIcon     from 'material-ui-icons/Stop';
import StepNextIcon from 'material-ui-icons/ArrowForward';
import StepInIcon   from 'material-ui-icons/ArrowDownward';
import StepOutIcon  from 'material-ui-icons/ArrowUpward';


/** Component styling object. */
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
    button: {
        width:  theme.spacing.unit * 4,
        height: theme.spacing.unit * 4,
    }
});

/**
 * This component ___.
 */
class ControlBar extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Renders ___.
     */
    render() {
        const { classes, executeDebuggerCommand } = this.props;

        return (
            <div className={classes.container}>
                <div className={classes.controls}>
                    <Paper className={classes.paper}>
                        <Tooltip title="Continue">
                            <IconButton aria-label="Continue"
                                        classes={{root: classes.button}}
                                        onClick={() => executeDebuggerCommand('continue')}>
                                <img src={ContinueIcon}/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Step Next">
                            <IconButton aria-label="Step Next"
                                        classes={{root: classes.button}}
                                        onClick={() => executeDebuggerCommand('step_over')}>
                                <img src={StepNextIcon}/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Step In">
                            <IconButton aria-label="Step In"
                                        classes={{root: classes.button}}
                                        onClick={() => executeDebuggerCommand('step_into')}>
                                <img src={StepInIcon}/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Step Out">
                            <IconButton aria-label="Step Out"
                                        classes={{root: classes.button}}
                                        onClick={() => executeDebuggerCommand('step_out')}>
                               <img src={StepOutIcon}/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Stop">
                            <IconButton aria-label="Stop"
                                        classes={{root: classes.button}}
                                        onClick={() => executeDebuggerCommand('stop')}>
                                <img src={StopIcon}/>
                            </IconButton>
                        </Tooltip>
                    </Paper>
                </div>
            </div>
        );
    }
}

// Inject styles and data into component
function mapStateToProps(state, props) {
    return {
        // TODO get the pause/unpaused state of the program here
    };
}
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        executeDebuggerCommand,
    }, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ControlBar));
