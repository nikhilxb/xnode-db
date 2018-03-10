import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from "classnames";

import { line, curveBasis, curveLinear } from 'd3';
import ColorGrey from 'material-ui/colors/grey';
import ColorBlue from 'material-ui/colors/blue';

import Tooltip from '../../Tooltip';


class TestDisplay extends Component {
    render() {
        return <rect x={this.props.x} y={this.props.y} width={50} height={50} fill="blue" />
    }
}

/**
 * This dumb component renders an edge between two nodes in a computation graph, corresponding to the flow of a graph
 * data object.
 */
class GraphDataEdge extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes:        PropTypes.object.isRequired,
        symbolId:       PropTypes.string.isRequired,
        selectedId:     PropTypes.string,
        hoverId:        PropTypes.string,
        setSelectedId:  PropTypes.func.isRequired,
        setHoverId:     PropTypes.func.isRequired,
        isTemporal:     PropTypes.bool.isRequired,
    };

    render() {
        const { classes, points } = this.props;
        const { symbolId, selectedId, hoverId, setSelectedId, setHoverId, isTemporal } = this.props;
        let pathString = null;
        if (isTemporal) {
            let curveGenerator = line().curve(curveBasis);
            // TODO decide whether to use the linear generator for the first bend
            // let linearGenerator = line().curve(curveLinear);
            pathString = curveGenerator(points.map(({x, y}) => [x, y]));//linearGenerator(points.filter((p, i) => i <= 1).map(({x, y}) => [x, y])) + curveGenerator(points.filter((p, i) => i > 0).map(({x, y}) => [x, y]));  // [{x:3, y:4},...] => [[3, 4],...]
        }
        else {
            let linearGenerator = line().curve(curveLinear);
            pathString = linearGenerator(points.map(({x, y}) => [x, y]));  // [{x:3, y:4},...] => [[3, 4],...]
        }
        return (
            <g>
                <Tooltip display={<TestDisplay/>} width={50} height={50}>
                    <path d={pathString}
                          className={classes.hotspot}
                          onClick={() => setSelectedId(symbolId)}
                          onMouseEnter={() => setHoverId(symbolId)}
                          onMouseLeave={() => setHoverId(null)} />
                </Tooltip>
                <path d={pathString}
                      pointerEvents="none"
                      
                      className={classNames({
                          [classes.normal]:   true,
                          [classes.temporal]: isTemporal,
                          [classes.hover]:    hoverId === symbolId,
                          [classes.selected]: selectedId === symbolId,
                      })} />
            </g>
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    hotspot: {
        fill: 'none',
        stroke: 'transparent',
        strokeWidth: 12,
    },
    normal: {
        fill: 'none',
        stroke: ColorGrey[600],
        strokeWidth: 2.5,
    },
    temporal: {
        opacity: 0.5,
        strokeWidth: 2.5,
    },
    hover: {
        stroke: ColorGrey[600],
        opacity: 1,
        strokeWidth: 5,
    },
    selected: {
        stroke: ColorBlue[600],
        opacity: 1,
        strokeWidth: 5,
    },
});

export default withStyles(styles)(GraphDataEdge);
