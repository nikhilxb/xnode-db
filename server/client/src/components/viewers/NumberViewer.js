import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';

import Typography from 'material-ui/Typography';


/**
 * This class renders a number variable, with for `payload`: {
 *     contents: 86,
 * }
 */
class NumberViewer extends Component {
    render() {
        const { classes, payload } = this.props;
        return (
            <Typography component="p" className={classes.label}>
                {payload.contents}
            </Typography>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    label: {
        textAlign: 'center',
    }
});

export default withStyles(styles)(NumberViewer);
