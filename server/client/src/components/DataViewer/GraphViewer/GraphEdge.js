import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import DataViewer from '../DataViewer.js';
import { graphlib } from 'dagre';
import { Line } from 'react-lineto';

const styles = {
    root: {

    }
};

/**
 * This class ___.
 */
class GraphEdge extends Component {
    render() {
        let points = this.props.points;
        let segments = [];
        for (let i=0; i < points.length - 1; i++) {
            segments.push([points[i], points[i+1]]);
        }
        let lineComponents = segments.map((segment) =>
            <Line x0={segment[0].x} y0={segment[0].y} x1={segment[1].x} y1={segment[1].y} />
        );
        return lineComponents;
    }
}

export default withStyles(styles)(GraphEdge);
