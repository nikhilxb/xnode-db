import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";


/**
 * This class renders a number variable in the enclosing frame.
 */
class NumberViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
        symbolId: PropTypes.string.isRequired,
        viewerId: PropTypes.number.isRequired,
        payload: PropTypes.object.isRequired,
    };

    render() {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 -100 400 400">
                <marker id="triangle" viewBox="0 0 10 10" refX="0" refY="5" markerUnits="strokeWidth" markerWidth="4" markerHeight="3" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z"/>
                </marker>

                <marker id="curveangle" viewBox="-7.72 -4.3 7.72 8.6" refX="-6" refY="0" markerUnits="strokeWidth" markerWidth="4" markerHeight="3" orient="auto">
                    <path d="M 0,0 a 27.2,27.2,0,0,0,-7.67,4.28 l 1.55,-4.28 l -1.55,-4.28 a 27.2,27.2,0,0,0,7.67,4.28 z" />
                </marker>

                <marker id="arrowhead1" viewBox="-8 -5 8 10" refX="-3.25" refY="0" markerUnits="strokeWidth" markerWidth="4" markerHeight="3" orient="auto">
                    <path d="M 0 0
                             a 32 32 0 0 0 -8 5
                             l 1.5 -5
                             l -1.5 -5
                             a 32 32 0 0 0 8 5
                             z" />
                </marker>

                <marker id="arrowhead" viewBox="-5 -3 5 6" refX="0" refY="0" markerUnits="strokeWidth" markerWidth="4" markerHeight="3" orient="auto">
                    <path d="M 0 0
                             l 0 1
                             a 32 32 0 0 0 -5 2
                             l 1.5 -3
                             l -1.5 -3
                             a 32 32 0 0 0 5 2
                             l 0 1
                             z" />
                </marker>

                <line x1="0" y1="50.5" x2="100" y2="50.5" markerEnd="url(#curveangle)" stroke="black" strokeWidth="10"/>
                <polyline points="0 100 100 100" markerEnd="url(#arrowhead)" stroke="black" strokeWidth="10"/>
                <path d="M0 150.5l100 0" markerEnd="url(#triangle)" stroke="black" strokeWidth="10"/>
            </svg>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    label: {
        textAlign: 'center',
    }
});

export default withStyles(styles)(NumberViewer);
