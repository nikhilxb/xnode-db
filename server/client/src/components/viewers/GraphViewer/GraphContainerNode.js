import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';

import ColorLightBlue from 'material-ui/colors/lightBlue'
import classNames from "classnames";
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

        selectedId:     PropTypes.string,
        hoverId:        PropTypes.string,
        setSelectedId:  PropTypes.func.isRequired,
        setHoverId:     PropTypes.func.isRequired,
    };

    render() {
        const { classes, width, height, x, y } = this.props;
        const { toggleExpanded, isExpanded } = this.props;
        const { symbolId, selectedId, hoverId, setSelectedId, setHoverId } = this.props;
        return (
            <rect width={width} height={height} x={x} y={y}
                  className={classNames({
                      [classes.normal]:   true,
                      [classes.hover]:    hoverId === symbolId,
                      [classes.selected]: selectedId === symbolId,
                  })}
                  onClick={() => {
                      toggleExpanded();
                      setSelectedId(symbolId);
                  }}
                  onMouseEnter={() => setHoverId(symbolId)}
                  onMouseLeave={() => setHoverId(null)} />
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    normal: {
        fill: ColorLightBlue[200],
        fillOpacity: 0.2,
    },
    hover: {
        fill: ColorLightBlue[400],
    },
    selected: {
        fill: ColorLightBlue[400],
        stroke: ColorBlue[600],
        strokeWidth: 4,
    }
});

export default withStyles(styles)(GraphContainerNode);
