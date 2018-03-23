import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import ColorPink from 'material-ui/colors/pink';
import ColorBlue from "material-ui/colors/blue";
import ColorGrey from 'material-ui/colors/grey';


/**
 * This dumb component renders an op node in a computation graph.
 */
class GraphOpNode extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes:        PropTypes.object.isRequired,
        width:          PropTypes.number.isRequired,
        height:         PropTypes.number.isRequired,
        x:              PropTypes.number.isRequired,
        y:              PropTypes.number.isRequired,

        symbolId:       PropTypes.string.isRequired,
        type:           PropTypes.string.isRequired,
        str:            PropTypes.string.isRequired,
        name:           PropTypes.string,
        payload:        PropTypes.object.isRequired,

        selectedIds:    PropTypes.array,
        hoverIds:       PropTypes.array,
        setSelected:    PropTypes.func.isRequired,
        setHover:       PropTypes.func.isRequired,
    };

    render() {
        const { classes, width, height, x, y } = this.props;
        const { symbolId, payload, selectedIds, hoverIds, setSelected, setHover } = this.props;
        const { functionname } = payload;
        return (
            <g>
                <rect x={x} y={y} width={width} height={height}
                      className={classNames({
                          [classes.normal]:   true,
                          [classes.smooth]:   true,
                          [classes.hover]:    hoverIds.includes(symbolId),
                          [classes.selected]: selectedIds.includes(symbolId),
                      })}
                      onClick={() => setSelected()}
                      onMouseEnter={() => setHover(true)}
                      onMouseLeave={() => setHover(false)} />

                <foreignObject x={x} y={y} width={width} height={height} pointerEvents="none">
                    <div className={classes.label}>
                        {functionname}
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
        // transition: [
        //     theme.transitions.create(['width', 'height', 'x', 'y'], { duration: theme.transitions.duration.short }),
        //     theme.transitions.create(['fill-opacity'], { duration: theme.transitions.duration.shortest, delay: theme.transitions.duration.short })
        // ].join(", "),
    },
    normal: {
        fill: ColorPink[500],
        stroke: 'transparent',
        strokeWidth: 4,
        rx: 4,
        ry: 4,
    },
    hover: {
        stroke: ColorPink[700],
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

export default withStyles(styles)(GraphOpNode);
