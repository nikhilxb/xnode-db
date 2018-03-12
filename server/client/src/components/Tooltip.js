import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';


/**
 * This dumb component renders an SVG tooltip component for its SVG `children`. The tooltip positions its `display` to
 * be on screen no matter where the mouse is. It shows the `display` on hover after a short timeout period, and
 * indefinitely if `isFixed`. It passes props `x` and `y` in absolute coordinates to `display` for it to render itself.
 */
class Tooltip extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes:    PropTypes.object.isRequired,
        children:   PropTypes.node,
        display:    PropTypes.element.isRequired,
        width:      PropTypes.number.isRequired,
        height:     PropTypes.number.isRequired,
        isFixed:    PropTypes.bool,
    };

    /** Constructor. */
    constructor(props) {
        super(props);
        this.state = {
            displayX: 0,
            displayY: 0,
            isVisible: false
        };
    }

    updateDisplayCoords(e) {
        const { width, height } = this.props;

        // Using offsetX/Y works in Chrome. From W3C: "W3C Working Draft. Mouse position relative to the target
        // element. This is implemented very inconsistently between browsers."
        let displayX = e.nativeEvent.offsetX - width / 2;
        displayX = displayX >= 0 ? displayX : 0;
        let displayY = e.nativeEvent.offsetY - height - 12;
        displayY = displayY >= 0 ? displayY : e.nativeEvent.offsetY + 12 + 12;

        this.setState({
            displayX,
            displayY,
        });
    }

    /** Schedules opening with delay. */
    enterTimer = null;

    updateDisplayVisibility(isVisible) {
        const { isFixed } = this.props;

        clearTimeout(this.enterTimer);
        // if(!isVisible) {
        //     this.setState({
        //         isVisible: isVisible,
        //     });
        // } else {
        //     this.enterTimer = setTimeout(() => {
        //         this.setState({
        //             isVisible: isVisible,
        //         });
        //     }, 250);
        // }
        this.setState({
            isVisible: isVisible,
        });
    }

    /**
     * Renders the SVG children nodes inside a new group, on which mouse handler a.
     */
    render() {
        const { classes, children, display, width, height } = this.props;

        return (
            <g>
                <g onMouseMove={(e) => this.updateDisplayCoords(e)}
                   onMouseEnter={() => this.updateDisplayVisibility(true)}
                   onMouseLeave={() => this.updateDisplayVisibility(false)}>
                    {children}
                </g>
                {this.state.isVisible && React.cloneElement(display, {
                    x: this.state.displayX,
                    y: this.state.displayY,
                    width,
                    height,
                })}
            </g>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    // css-key: value,
});

export default withStyles(styles)(Tooltip);