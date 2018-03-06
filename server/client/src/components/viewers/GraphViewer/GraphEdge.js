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
        const { classes, points } = this.props;
        let segments = [];
        for (let i=0; i < points.length - 1; i++) {
            segments.push([points[i], points[i + 1]]);
        }
        return segments.map((segment, i) =>
            <line key={i} className={classes.graphEdge}
                  x1={segment[0].x} y1={segment[0].y} x2={segment[1].x} y2={segment[1].y} stroke="blue" strokeWidth={3}  />
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    graphEdge: {
        strokeWidth: 2,
        strokeColor: '#FF0000',
        color: '#FF0000'
    }
});

export default withStyles(styles)(GraphEdge);
