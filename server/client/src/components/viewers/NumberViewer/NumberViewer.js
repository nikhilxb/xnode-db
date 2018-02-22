import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';

const styles = theme => ({
    label: {
      textAlign: 'center',
    }
});

/**
 * This class renders a number variable in the Canvas.
 */
class NumberViewer extends Component {
    render() {
        return (
            <Typography component="p" className={this.props.classes.label}>
                    {this.props.data}
            </Typography>
        );
    }
}

export default withStyles(styles)(NumberViewer);
