import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';

import ColorLightBlue from 'material-ui/colors/lightBlue'


/**
 * This dumb component renders a container in a computation graph.
 */
class GraphContainerNode extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    render() {
        const { classes, toggleExpanded, width, height, x, y } = this.props;
        return (
            <rect width={width} height={height} x={x} y={y}
                  onClick={toggleExpanded} className={classes.node} />
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    node: {
        fill: ColorLightBlue[300],
        opacity: 0.2,
        '&:hover': {
            fill: ColorLightBlue[400]
        }
    }
});

export default withStyles(styles)(GraphContainerNode);
