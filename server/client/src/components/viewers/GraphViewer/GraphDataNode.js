import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import ColorOrange from 'material-ui/colors/orange';
import ColorBlue from "material-ui/colors/blue";


/**
 * This dumb component renders a data node in a computation graph.
 */
class GraphDataNode extends Component {

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

    /** Renders the data node rectangle, for terminals of data edges. */
    render() {
        const { classes, width, height, x, y } = this.props;
        const { symbolId, selectedIds, hoverIds, setSelected, setHover } = this.props;
        return (
            <rect width={width} height={height} x={x} y={y}
                  className={classNames({
                      [classes.normal]:   true,
                      [classes.smooth]:   true,
                      [classes.hover]:    hoverIds.includes(symbolId),
                      [classes.selected]: selectedIds.includes(symbolId),
                  })}
                  onClick={() => setSelected()}
                  onMouseEnter={() => setHover(true)}
                  onMouseLeave={() => setHover(false)} />
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
        fill: ColorOrange[600],
        stroke: 'transparent',
        strokeWidth: 4,
        rx: 4,
        ry: 4,
    },
    hover: {
        stroke: ColorOrange[700],
    },
    selected: {
        stroke: ColorBlue[600],
    }
});

export default withStyles(styles)(GraphDataNode);
