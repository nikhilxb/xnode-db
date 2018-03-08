import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';


/**
 * This dumb component renders a data node viewer that displays the key-value pairs. It is shown on hover of data nodes
 * and edges.
 */
class GraphDataViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /** Renders the data node block, and on hover */
    render() {
        const { width, height, x, y } = this.props;
        return (
            <g>
                <rect width={width} height={height} x={x} y={y} fill='#75CE8A'/>
                <text x={x} y={y}>"GraphDataViewer"</text>
            </g>
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
