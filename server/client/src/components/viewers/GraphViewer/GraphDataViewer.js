import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import classNames from 'classnames';

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
        contents:       PropTypes.object,
    };

    /** Renders the data node block, and on hover */
    render() {
        const { classes, width, height, x, y, contents} = this.props;

        let component;
        if(!contents) {
            component = null;
        } else {
            const { symbolId, payload } = contents;
            component = JSON.stringify(payload);
        }

        return (
            <foreignObject x={x} y={y} width={width} height={height} pointerEvents="none">
                <div className={classes.container}>
                    {component}
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
        overflow:'auto',
        wordWrap: 'break-word',

        backgroundColor: 'white',
        opacity: 0.9,
        borderStyle: 'solid',
        borderColor: ColorBlue[600],
        borderWidth: 1,
        borderRadius: 2,
    }
});

export default withStyles(styles)(GraphDataViewer);
