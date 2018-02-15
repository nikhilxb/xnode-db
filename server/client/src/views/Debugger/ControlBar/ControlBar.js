import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';

import Paper from 'material-ui/Paper';


const styles = theme => ({
    container: {
        display: 'block',
        backgroundColor: 'rgb(2, 2, 2)',
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

    // Define the expected types in props
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
                        Herro
                    </Paper>
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(ControlBar);
