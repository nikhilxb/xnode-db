import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { line, curveBasis, curveLinear } from 'd3';
import ColorGrey from 'material-ui/colors/grey';
import ColorBlue from 'material-ui/colors/blue';


/**
 * This dumb component renders an edge between two nodes in a computation graph, corresponding to the flow of a graph
 * data object.
 */
class GraphDataEdge extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes:        PropTypes.object.isRequired,
        edgeId:         PropTypes.string.isRequired,
        points:         PropTypes.array.isRequired,
        isTemporal:     PropTypes.bool.isRequired,
        sourceSymbolId: PropTypes.string.isRequired,
        targetSymbolId: PropTypes.string.isRequired,
        argName:        PropTypes.string.isRequired,

        symbolId:       PropTypes.string.isRequired,
        name:           PropTypes.string,
        str:            PropTypes.string.isRequired,
        payload:        PropTypes.object.isRequired,

        selectedIds:    PropTypes.array,
        hoverIds:       PropTypes.array,
        setSelected:    PropTypes.func.isRequired,
        setHover:       PropTypes.func.isRequired,
    };

    render() {
        const { classes, edgeId, points, isTemporal, sourceSymbolId, targetSymbolId, argName } = this.props;
        const { symbolId, selectedIds, hoverIds, setSelected, setHover } = this.props;
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

        const isHovered = hoverIds.includes(symbolId) ||
            hoverIds.includes(sourceSymbolId) ||
            hoverIds.includes(targetSymbolId) ||
            selectedIds.includes(sourceSymbolId) ||
            selectedIds.includes(targetSymbolId);
        const isSelected = selectedIds.includes(symbolId);
        const isOthersActive = (hoverIds.size || selectedIds.size) && !isHovered && !isSelected;

        // edge id needs to be globally unique, not just within this svg component
        return (
            <g>
                <path d={pathString}
                      className={classNames({
                          [classes.hotspot]: true,
                          [classes.smooth]:  true,
                      })}
                      onClick={() => setSelected()}
                      onMouseEnter={() => setHover(true)}
                      onMouseLeave={() => setHover(false)} />
                <path id={edgeId}
                      d={pathString}
                      pointerEvents="none"
                      className={classNames({
                          [classes.edge]:           true,
                          [classes.smooth]:  true,
                          [classes.temporal]:       isTemporal && !isSelected,
                          [classes.dimmed]:         isOthersActive,
                          [classes.edgeHovered]:    isHovered,
                          [classes.edgeSelected]:   isSelected,
                      })} />
                <text dy="-1.5"
                      textAnchor="end"
                      pointerEvents="none"
                      className={classNames({
                          [classes.label]:          true,
                          [classes.smooth]:  true,
                          [classes.dimmed]:         isOthersActive,
                          [classes.labelHovered]:   isHovered,
                          [classes.labelSelected]:  isSelected,
                      })} >
                    <textPath xlinkHref={`#${edgeId}`} startOffset="95%">
                        {argName}
                    </textPath>
                </text>
            </g>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    smooth: {
        // transition: [
        //     theme.transitions.create(['width', 'height', 'x', 'y'], { duration: theme.transitions.duration.short }),
        // ].join(", "),
    },
    hotspot: {
        fill: 'none',
        stroke: 'transparent',
        strokeWidth: 12,
    },
    edge: {
        fill: 'none',
        stroke: ColorGrey[600],
        strokeWidth: 2.5,
        markerEnd: 'url(#arrowheadGrey)',
    },
    edgeHovered: {
        opacity: 1,
        strokeWidth: 3.5,
    },
    edgeSelected: {
        opacity: 1,
        stroke: ColorBlue[600],
        strokeWidth: 3.5,
        markerEnd: 'url(#arrowheadBlue)',
    },
    temporal: {
        opacity: 0.5,
    },
    dimmed: {
        opacity: 0.1,
    },
    label: {
        opacity: 0,
        textAlign: 'right',
        fontFamily: theme.typography.monospace.fontFamily,
        fontSize: '7pt',
        color: ColorGrey[600],
    },
    labelHovered: {
        opacity: 1,
        fontWeight: theme.typography.fontWeightMedium,
    },
    labelSelected: {
        opacity: 1,
        color: ColorBlue[600],
    }
});

export default withStyles(styles)(GraphDataEdge);
