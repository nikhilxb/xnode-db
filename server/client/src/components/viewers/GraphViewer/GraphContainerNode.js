import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import ColorLightBlue from 'material-ui/colors/lightBlue'
import ColorBlue from "material-ui/colors/blue";


/**
 * This dumb component renders a container in a computation graph.
 */
class GraphContainerNode extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes:        PropTypes.object.isRequired,
        width:          PropTypes.number.isRequired,
        height:         PropTypes.number.isRequired,
        x:              PropTypes.number.isRequired,
        y:              PropTypes.number.isRequired,

        symbolId:       PropTypes.string.isRequired,
        type:           PropTypes.string.isRequired,
        name:           PropTypes.string,
        str:            PropTypes.string.isRequired,
        payload:        PropTypes.object.isRequired,

        toggleExpanded: PropTypes.func.isRequired,
        isExpanded:     PropTypes.bool.isRequired,
        isTemporal:     PropTypes.bool.isRequired,

        selectedIds:    PropTypes.array,
        hoverIds:       PropTypes.array,
        setSelected:    PropTypes.func.isRequired,
        setHover:       PropTypes.func.isRequired,
    };

    render() {

        const { classes, width, height, x, y } = this.props;
        const { toggleExpanded, isExpanded, isTemporal } = this.props;
        const { symbolId, payload, selectedIds, hoverIds, setSelected, setHover } = this.props;
        const { functionname } = payload;

        return (
            <g>
                <rect width={width} height={height} x={x} y={y}
                      className={classNames({
                          [classes.normal]:    true,
                          [classes.smooth]:    isExpanded,
                          [classes.collapsed]: !isExpanded,
                          [classes.hover]:     hoverIds.includes(symbolId),
                          [classes.selected]:  selectedIds.includes(symbolId),
                      })}
                      onClick={() => setSelected()}
                      onDoubleClick={() => toggleExpanded()}
                      onMouseEnter={() => setHover(true)}
                      onMouseLeave={() => setHover(false)} />

                <foreignObject x={x} y={y} width={width} height={height} pointerEvents="none">
                    <div className={classes.label}>
                        {isExpanded ? '' : functionname}
                    </div>
                </foreignObject>
            </g>
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    smooth: {
        transition: [
            theme.transitions.create(['width', 'height', 'x', 'y'], { duration: theme.transitions.duration.short }),
            theme.transitions.create(['fill-opacity'], { duration: theme.transitions.duration.shortest, delay: theme.transitions.duration.short })
        ].join(", "),
    },
    normal: {
        fill: ColorLightBlue[200],
        fillOpacity: 0.2,
        stroke: 'transparent',
        strokeWidth: 4,
        rx: 4,
        ry: 4,
    },
    collapsed: {
        fillOpacity: 1.0,
    },
    hover: {
        stroke: ColorLightBlue[400],
    },
    selected: {
        stroke: ColorBlue[600],
    },
    label: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: '1.3rem',
        fontWeight: 'bold',
        color: 'white',
    },
});

export default withStyles(styles)(GraphContainerNode);
