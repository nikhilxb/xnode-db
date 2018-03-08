import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';

import ColorOrange from 'material-ui/colors/orange';


/**
 * This dumb component renders a data node in a computation graph.
 */
class GraphDataNode extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /** Renders the data node rectangle, for terminals of data edges. */
    render() {
        const { classes, width, height, x, y } = this.props;
        return (
            <rect width={width} height={height} x={x} y={y} className={classes.node} />
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    node: {
        fill: ColorOrange[400],
        '&:hover': {
            fill: ColorOrange[600]
        }
    }
});

export default withStyles(styles)(GraphDataNode);
