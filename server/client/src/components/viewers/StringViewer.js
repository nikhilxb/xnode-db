import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';

const styles = theme => ({
    label: {
      textAlign: 'center',
    }
});

/**
 * This class renders a string variable in the Canvas.
 */
class StringViewer extends Component {
    render() {
        return (
            <div />
        );
    }
}

export default withStyles(styles)(StringViewer);
