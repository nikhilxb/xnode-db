import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';

import { line } from 'd3';
import ColorGrey from 'material-ui/colors/grey';


/**
 * This dumb component renders an edge between two nodes in a computation graph, corresponding to the flow of a graph
 * data object.
 */
class GraphDataEdge extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    render() {
        const { classes, points } = this.props;
        // let segments = [];
        // for (let i=0; i < points.length - 1; i++) {
        //     segments.push([points[i], points[i + 1]]);
        // }
        // return segments.map((segment, i) =>
        //     <line key={i} className={classes.graphEdge}
        //           x1={segment[0].x} y1={segment[0].y} x2={segment[1].x} y2={segment[1].y} />
        // );

        let pathstr = line()(points.map(elem => [elem.x, elem.y]));  // [{x:3, y:4},...] => [[3, 4],...]
        return (
            <g>
                <path className={classes.hotspot} d={pathstr}/>
                <path className={classes.edge} d={pathstr} pointerEvents="none" />
            </g>
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    edge: {
        fill: 'none',
        stroke: ColorGrey[600],
        strokeWidth: 2.5,
    },
    hotspot: {
        fill: 'none',
        stroke: 'transparent',
        strokeWidth: 12,
        '&:hover + $edge': {  // order matters
            stroke: ColorGrey[700],
            strokeWidth: 5,
        }
    }
});

export default withStyles(styles)(GraphDataEdge);
