import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";


/**
 * This class renders a tensor variable in the enclosing frame, with `payload`: {
 *     contents: [[...]...],
 *     type: "float32",
 *     size: [3, 4, ...],
 * }
 */
class TensorViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
        payload: PropTypes.object.isRequired,
    };

    render() {
        const {payload} = this.props;
        console.log("TensorViewer render() with props:", this.props);
        return (
            <div>
                {payload.contents}
            </div>
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

export default withStyles(styles)(TensorViewer);
