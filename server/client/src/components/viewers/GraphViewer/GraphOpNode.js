import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import ColorPink from 'material-ui/colors/pink';
import ColorBlue from "material-ui/colors/blue";


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
        selectedId:     PropTypes.string,
        hoverId:        PropTypes.string,
        setSelectedId:  PropTypes.func.isRequired,
        setHoverId:     PropTypes.func.isRequired,
    };

    render() {
        const { classes, width, height, x, y, str } = this.props;
        const { symbolId, selectedId, hoverId, setSelectedId, setHoverId } = this.props;
        return (
            <g>
                <rect x={x} y={y} width={width} height={height}
                      className={classNames({
                          [classes.normal]:   true,
                          [classes.hover]:    hoverId === symbolId,
                          [classes.selected]: selectedId === symbolId,
                      })}
                      onClick={() => setSelectedId(symbolId)}
                      onMouseEnter={() => setHoverId(symbolId)}
                      onMouseLeave={() => setHoverId(null)} />

                <foreignObject x={x} y={y} width={width} height={height} pointerEvents="none">
                    <div className={classes.label}>
                        {str.replace(/graphop <(.*)>/, '$1')}
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
    normal: {
        fill: ColorPink[400],
    },
    hover: {
        fill: ColorPink[600],
    },
    selected: {
        fill: ColorPink[600],
        stroke: ColorBlue[600],
        strokeWidth: 4,
    },
    label: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 14,
        fontFamily: "Roboto",
    },
});

export default withStyles(styles)(GraphOpNode);
