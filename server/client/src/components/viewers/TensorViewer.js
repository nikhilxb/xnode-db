import React, { Component, PureComponent } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import { scaleLinear, color } from 'd3';


// Configurable units
const SIZE = 20;    // Maximum size (in px) of pixel square
const SPACING = 0;  // Space (in px) between adjacent pixel squares
const PADDING = 5;  // Space (in px) around the entire pixel display

// Derived units
const COLOR = scaleLinear().domain([-1, 0, 1]).range(['#0571b0', '#f7f7f7', '#ca0020']).clamp(true);
const JUMP = SIZE + SPACING;  // Distance between adjacent pixel centers
const OFFSET = SIZE / 2;      // Distance from pixel edge to center

/**
 * This dumb component renders the pixels of a tensor. Each pixel represents an element in the tensor.
 */
class TensorPixels extends PureComponent {

    /** Prop expected types object. */
    static propTypes = {
        pixels:             PropTypes.array.isRequired,
        handleHighlight:    PropTypes.func.isRequired
    };

    render() {
        const { pixels, handleHighlight } = this.props;
        return (
            <g className="pixels">
                {pixels.map((p, i) => {
                    return (
                        <g key={i}>
                            <rect width={p.size} height={p.size} x={p.x} y={p.y} fill={p.color} />
                            <rect width={JUMP} height={JUMP} x={p.cx} y={p.cy} fill={'transparent'}
                                  onMouseEnter={() => handleHighlight(p)}
                                  onMouseLeave={() => handleHighlight(null)}/>
                        </g>
                    );
                })}
            </g>
        );
    }
}

/**
 * This dumb component renders elements that appear on highlight of a single pixel.
 */
class TensorHighlight extends PureComponent {

    /** Prop expected types object. */
    static propTypes = {
        highlight: PropTypes.object,
    };

    render() {
        const { highlight: h } = this.props;
        if(!h) return null;
        return (
            <g className="highlight">
                <rect width={SIZE} height={SIZE} x={h.cx} y={h.cy} fill={h.color}
                      strokeWidth={4} stroke={color(h.color).darker()}
                      pointerEvents="none"/>
            </g>
        );
    }
}

/**
 * This dumb component renders a tensor variable in the enclosing frame, with
 * `payload`: {
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

    /** Constructor. */
    constructor(props) {
        super(props);
        this.state = {
            elements: this.generateElements(props.payload),
            highlight: null,
        };
    }

    /**
     * Triggered on highlight start and end to update state.
     * @param h The highlighted `pixel` object; `null` if none highlighted.
     */
    handleHighlight(h) {
        this.setState({
            highlight: h,
        });
    }

    /**
     * Transforms the `contents` of `payload` into visualization elements (e.g. pixel squares).
     * TODO: Adapt this to scale to arbitrary dimensions.
     * TODO: Add more information, colorbar, options, etc.
     * @param payload
     * @returns {{pixels: Array, width: number, height: number}}
     */
    generateElements(payload) {
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
                let cx = JUMP * c;  // corner positions
                let cy = JUMP * r;

                pixels.push({
                    size,
                    x,
                    y,
                    cx,
                    cy,
                    color: COLOR(scale),
                });
            }
        }

        return { pixels: pixels, width: JUMP * COLS, height: JUMP * ROWS };
    }

    /** Renders the pixels and highlight elements in an svg. */
    render() {
        const { elements, highlight } = this.state;
        const { pixels, width, height } = elements;

        return (
            <svg width={width + 2*PADDING} height={height + 2*PADDING}
                 viewBox={`${-PADDING} ${-PADDING} ${width + 2*PADDING} ${height + 2*PADDING}`}>
                <TensorPixels pixels={pixels} handleHighlight={this.handleHighlight.bind(this)} />
                <TensorHighlight highlight={highlight} />
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
