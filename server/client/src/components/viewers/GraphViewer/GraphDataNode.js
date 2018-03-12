import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from "classnames";

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

        selectedId:     PropTypes.string,
        hoverId:        PropTypes.string,
        setSelected:    PropTypes.func.isRequired,
        setHover:       PropTypes.func.isRequired,
    };

    /** Renders the data node rectangle, for terminals of data edges. */
    render() {
        const { classes, width, height, x, y } = this.props;
        const { symbolId, payload, selectedId, hoverId, setSelected, setHover } = this.props;
        return (
            <rect width={width} height={height} x={x} y={y}
                  className={classNames({
                      [classes.normal]:   true,
                      [classes.hover]:    hoverId === symbolId,
                      [classes.selected]: selectedId === symbolId,
                  })}
                  onClick={() => setSelected({symbolId, payload})}
                  onMouseEnter={() => setHover({symbolId, payload})}
                  onMouseLeave={() => setHover(null)} />
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    normal: {
        fill: ColorOrange[600],
        stroke: 'transparent',
        strokeWidth: 4,
    },
    hover: {
        stroke: ColorOrange[700],
    },
    selected: {
        stroke: ColorBlue[600],
    }
});

export default withStyles(styles)(GraphDataNode);
