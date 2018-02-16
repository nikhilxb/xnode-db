import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';


/** Component styling object. */
const styles = theme => ({
});

/**
 * This component ___.
 */
class Example extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /** Constructor. */
    constructor(props) {
        super(props);
    }

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
