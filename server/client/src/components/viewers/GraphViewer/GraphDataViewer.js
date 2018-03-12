import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';

import ColorBlue from "material-ui/colors/blue";


/**
 * This dumb component renders a data node viewer that displays the key-value pairs. It is shown on hover of data nodes
 * and edges.
 */
class GraphDataViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes:        PropTypes.object.isRequired,
        width:          PropTypes.number.isRequired,
        height:         PropTypes.number.isRequired,
        x:              PropTypes.number.isRequired,
        y:              PropTypes.number.isRequired,
    };

    /** Renders the data node block, and on hover */
    render() {
        const { classes, width, height, x, y, val } = this.props;
        return (
            <foreignObject x={x} y={y} width={width} height={height} pointerEvents="none">
                <div className={classes.container}>
                    {val && val.symbolId}
                </div>
            </foreignObject>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    container: {
        height: '100%',
        overflow:'hidden',
        whiteSpace:'nowrap',
        backgroundColor: 'white',
        opacity: 0.9,
        borderStyle: 'solid',
        borderColor: ColorBlue[600],
        borderWidth: 1,
        borderRadius: 2,
    }
});

export default withStyles(styles)(GraphDataViewer);
