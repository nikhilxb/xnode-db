import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";


/**
 * This class renders a string variable in the enclosing frame.
 */
class StringViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
        symbolId: PropTypes.string.isRequired,
        viewerId: PropTypes.number.isRequired,
        payload: PropTypes.object.isRequired,
        str: PropTypes.string.isRequired,
    };

    render() {
        const { classes, str } = this.props;
        return (
            <div className={classes.label}>
                {str}
            </div>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    label: {
        margin: 'auto',
        textAlign: 'center',
    }
});

export default withStyles(styles)(StringViewer);
