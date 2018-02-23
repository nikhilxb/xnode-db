import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';


/**
 * This class renders a number variable in the Canvas.
 */
class NumberViewer extends Component {
    render() {
        return (
            <div />
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
