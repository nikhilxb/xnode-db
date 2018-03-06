import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";


/**
 * This class renders an edge betweeen two nodes in a computation graph.
 */
class GraphEdge extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    render() {
        let points = this.props.points;
        let segments = [];
        for (let i=0; i < points.length - 1; i++) {
            segments.push([points[i], points[i + 1]]);
        }
        return segments.map((segment, i) =>
            <line key={i} x1={segment[0].x} y1={segment[0].y} x2={segment[1].x} y2={segment[1].y} />
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    // css-key: value,
});

export default withStyles(styles)(GraphEdge);
