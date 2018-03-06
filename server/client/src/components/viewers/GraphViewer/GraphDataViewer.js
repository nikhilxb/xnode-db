import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";


/**
 * This dumb component renders a data node in a computation graph.
 */
class GraphDataViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    render() {
        return (
            <rect width="20px" height="20px" x={this.props.x} y={this.props.y} fill='#75CE8A'/>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    // css-key: value,
});

export default withStyles(styles)(GraphDataViewer);
