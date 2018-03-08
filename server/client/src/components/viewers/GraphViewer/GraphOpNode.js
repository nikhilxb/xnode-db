import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';

import ColorPink from 'material-ui/colors/pink';


/**
 * This dumb component renders an op node in a computation graph.
 */
class GraphOpNode extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes:  PropTypes.object.isRequired,
        width:    PropTypes.number.isRequired,
        height:   PropTypes.number.isRequired,
        x:        PropTypes.number.isRequired,
        y:        PropTypes.number.isRequired,
        symbolId: PropTypes.string.isRequired,
        type:     PropTypes.string.isRequired,
        name:     PropTypes.string,
        str:      PropTypes.string.isRequired,
        payload:  PropTypes.object.isRequired,
    };

    render() {
        const { classes, width, height, x, y, name } = this.props;
        return (
            <g>
                <rect width={width} height={height} x={x} y={y} className={classes.node} />
            </g>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    node: {
        fill: ColorPink[400],
        '&:hover': {
            fill: ColorPink[500]
        }
    }
});

export default withStyles(styles)(GraphOpNode);
