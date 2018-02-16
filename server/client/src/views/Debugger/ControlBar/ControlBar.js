import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

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
        const {classes} = this.props;

        return (
            <div className={classes.container}>
                <div className={classes.controls}>
                    <Paper>

                            <Tooltip title="Continue">
                                <IconButton aria-label="Continue">
                                    <ContinueIcon/>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Step Next">
                                <IconButton aria-label="Step Next">
                                    <StepNextIcon/>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Step In">
                                <IconButton aria-label="Step In">
                                    <StepInIcon/>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Step Out">
                                <IconButton aria-label="Step Out">
                                    <StepOutIcon/>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="Stop">
                                <IconButton aria-label="Stop">
                                    <StopIcon/>
                                </IconButton>
                            </Tooltip>

                    </Paper>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(ControlBar);
