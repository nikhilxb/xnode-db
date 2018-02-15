import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';

const styles = {
    container: {

    }
};

/**
 * This component ___.
 */
class Example extends Component {

    /**
     * Renders ___.
     */
    render() {
        return (
            <div className={this.props.classes.container}>
                "Herro there"
            </div>
        );
    }
}

export default withStyles(styles)(Example);
