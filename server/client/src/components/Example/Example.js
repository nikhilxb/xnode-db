import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';


const styles = theme => ({
});

/**
 * This component ___.
 */
class Example extends Component {

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
            null
        );
    }
}

export default withStyles(styles)(Example);
