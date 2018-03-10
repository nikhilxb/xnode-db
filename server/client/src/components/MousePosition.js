import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactCursorPosition from 'react-cursor-position';

/**
 * This dumb component is a thin wrapper around `ReactCursorPosition`, which wraps its children in an HTML div which
 * serves as a reference to which mouse coordinates are relative. Because of the HTML div, it must be used around
 * the uppermost `svg` component (or inside a `foreignObject`). All children wrapped by this component are passed the
 * following additional `props`: {
 *     mouseActive: Boolean,
 *     mousePosition: {x: Number, y: Number}
 * }
 */
class MousePosition extends Component {

    /** Prop expected types object. */
    static propTypes = {
        children: PropTypes.element,
    };

    /**
     * Renders the children components within an invisible mouse-tracking div.
     */
    render() {
        return (
            <ReactCursorPosition mapChildProps={({ isActive, position }) => {
                return {
                    mouseActive: isActive,
                    mousePosition: position,
                };
            }} {...this.props}/>
        );
    }
}

export default MousePosition;

