import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';

const styles = {
    root: {

    }
};

/**
 * This class ___.
 */
@withStyles(styles)
class Example extends Component {

    /**
     * Renders ___.
     */
    render() {
        return (
            <div className={this.props.classes.root}>
                "Herro there"
            </div>
        );
    }
}

export default Example;
