import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import { scaleLinear } from 'd3-scale';

/**
 * This class renders a tensor variable in the enclosing frame, with `payload`: {
 *     contents: [[...]...],
 *     type: "float32",
 *     size: [3, 4, ...],
 *     maxmag: 4.76
 * }
 */
class TensorViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
        symbolId: PropTypes.string.isRequired,
        viewerId: PropTypes.number.isRequired,
        payload: PropTypes.object.isRequired,
    };

    generatePixels(payload) {
        // Configurable units
        const SIZE = 20;    // Maximum size (in px) of pixel square
        const SPACING = 1;  // Space (in px) between adjacent pixel squares
        const COLOR = scaleLinear().domain([-1, 1]).range(["firebrick", "steelblue"]).clamp(true);

        // Derived units used in position calculation
        const JUMP = SIZE + SPACING;  // Distance between adjacent pixel centers
        const OFFSET = SIZE / 2;      // Distance from pixel edge to center

        const { contents } = payload;
        const [ROWS, COLS] = [contents.length, contents[0].length]
        let maxmag = payload.maxmag || 1;

        let pixels = [];
        for(let r = 0; r < ROWS; r++) {
            for(let c = 0; c < COLS; c++) {
                let scale = contents[r][c] / maxmag;
                let size = SIZE * Math.abs(scale);
                let x = OFFSET + JUMP * c - size / 2;
                let y = OFFSET + JUMP * r - size / 2;
                pixels.push(<rect width={size}
                                  height={size}
                                  x={x}
                                  y={y}
                                  fill={COLOR(scale)}
                />);
            }
        }

        return [pixels, JUMP * COLS, JUMP * ROWS];
    }

    render() {
        const { payload } = this.props;
        const [pixels, width, height] = this.generatePixels(payload);
        // <svg viewBox={`0 0 ${width} ${height}`}>
        return (
            <svg width={width} height={height}>
                {pixels}
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

export default withStyles(styles)(TensorViewer);
