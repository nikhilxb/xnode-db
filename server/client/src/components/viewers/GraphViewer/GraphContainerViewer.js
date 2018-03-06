import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";


/**
 * This dumb component renders an op node in a computation graph.
 */
class GraphContainerViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,

    };

    render() {
        // TODO: Make into one
        let { classes, toggleExpanded, symbolId } = this.props;
        return (
            <rect width={this.props.width} height={this.props.height} x={this.props.x} y={this.props.y} fill='#75CE8A'
                  onClick={() => toggleExpanded(symbolId)} className={classes.graphContainer} />
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
