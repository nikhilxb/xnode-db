import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";


/**
 * This dumb component renders a container in a computation graph.
 */
class GraphContainerViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    render() {
        const { classes, toggleExpanded, width, height, x, y } = this.props;
        return (
            <rect width={width} height={height} x={x} y={y} fill='#75CE8A'
                  onClick={toggleExpanded} className={classes.graphContainer} />
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    graphContainer: {
        opacity: 0.3,
    }
});

export default withStyles(styles)(GraphContainerViewer);
