import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";


/** Component styling object. */
const styles = theme => ({
    container: {
        minHeight: 600,
        padding: theme.spacing.unit * 4,
    }
});

/**
 * This class ___.
 */
class Canvas extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Renders ___.
     */
    render() {
        const {classes} = this.props;

        return (
            <div className={classes.container}>

            </div>
        );
    }
}

export default withStyles(styles)(Canvas);
