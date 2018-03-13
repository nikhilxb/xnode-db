import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from "classnames";

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

        selectedId:     PropTypes.string,
        hoverId:        PropTypes.string,
        setSelected:    PropTypes.func.isRequired,
        setHover:       PropTypes.func.isRequired,
    };

    render() {
        const { classes, width, height, x, y } = this.props;
        const { toggleExpanded, isExpanded, isTemporal } = this.props;
        const { symbolId, payload, selectedId, hoverId, setSelected, setHover } = this.props;
        const { functionname: functionName } = payload;
        return (
            <g>
                <rect width={width} height={height} x={x} y={y}
                      className={classNames({
                          [classes.normal]:    true,
                          [classes.collapsed]: !isExpanded,
                          [classes.hover]:     hoverId === symbolId,
                          [classes.selected]:  selectedId === symbolId,
                      })}
                      onClick={() => {
                          toggleExpanded();
                          setSelected({symbolId, payload});
                      }}
                      onMouseEnter={() => setHover({symbolId, payload})}
                      onMouseLeave={() => setHover(null)} />

                <foreignObject x={x} y={y} width={width} height={height} pointerEvents="none">
                    <div className={classes.label}>
                        {isExpanded ? '' : functionName}
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
        fill: ColorLightBlue[200],
        fillOpacity: 0.2,
    },
    collapsed: {
      fillOpacity: 1.0,
    },
    hover: {
        fill: ColorLightBlue[400],
    },
    selected: {
        fill: ColorLightBlue[400],
        stroke: ColorBlue[600],
        strokeWidth: 4,
    },
    label: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: 13,
        fontFamily: "Roboto",
        fontWeight: 'bold',
        color: 'white',
    },
});

export default withStyles(styles)(GraphContainerNode);
