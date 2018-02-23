import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';

import Typography from 'material-ui/Typography';


/**
 * This class renders a string variable, with for `payload`: {
 *     contents: "Hello there",
 * }
 */
class StringViewer extends Component {
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

export default withStyles(styles)(StringViewer);
