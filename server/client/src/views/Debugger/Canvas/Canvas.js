import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';

const styles = {
    container: {
        backgroundColor: 'rgb(248, 248, 248)',
        display: 'flex',
        flexGrow: 1,
        textAlign: 'center',
    }
};

/**
 * This class ___.
 */
class Canvas extends Component {

    /**
     * Renders ___.
     */
    render() {
        return (
            <div className={this.props.classes.container}>
                [Editor]
            </div>
        );
    }
}

export default withStyles(styles)(Canvas);
