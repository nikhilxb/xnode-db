import React, { Component, PureComponent } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from 'prop-types';
import { scaleLinear } from 'd3-scale';

// Configurable units
const SIZE = 20;    // Maximum size (in px) of pixel square
const SPACING = 1;  // Space (in px) between adjacent pixel squares

// Derived units
const COLOR = scaleLinear().domain([-1, 0, 1]).range(['#0571b0', '#f7f7f7', '#ca0020']).clamp(true);
const JUMP = SIZE + SPACING;  // Distance between adjacent pixel centers
const OFFSET = SIZE / 2;      // Distance from pixel edge to center

class TensorPixels extends PureComponent {

    /** Prop expected types object. */
    static propTypes = {
        pixels: PropTypes.array.isRequired,
        handleHighlight: PropTypes.func.isRequired
    };

    // <rect width={SIZE} height={SIZE} x={p.cx} y={p.cy}
    // onMouseEnter={handleHighlight(p)} onMouseLeave={handleHighlight(null)}/>
    render() {
        const { pixels, handleHighlight } = this.props;
        return (
            <g>
                {pixels.map((p, i) => {
                    return (
                        <g key={i}>
                            <rect width={p.size} height={p.size} x={p.x} y={p.y} fill={p.color} />
                            <rect width={JUMP} height={JUMP} x={p.cx} y={p.cy} style={{opacity: 0}}
                                  onMouseEnter={console.log(p)}/>
                        </g>
                    );
                })}
            </g>
        );
    }
}

class TensorHighlight extends PureComponent {

    /** Prop expected types object. */
    static propTypes = {
        highlight: PropTypes.object,
    };

    render() {
        const { highlight: h } = this.props;
        if(!h) return null;
        return (
            <g>
                <rect width={h.size} height={h.size} x={h.x} y={h.y} stroke={"#000000"} />
            </g>
        );
    }
}

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

    constructor(props) {
        super(props);
        this.state = {
            elements: this.generateElements(),
            highlight: null,
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            elements: this.generateElements(nextProps),
            highlight: null,
        })
    }

    handleHighlight(h) {
        this.setState({
            highlight: h,
        });
    }

    generateElements(payload = this.props.payload) {
        console.log("Generate Elements");
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

    render() {
        console.log("Render TensorViewer");
        const { elements, highlight } = this.state;
        const { pixels, width, height } = elements;

        return (
            <svg width={width} height={height}>
                <TensorPixels pixels={pixels} handleHighlight={this.handleHighlight.bind(this)}/>
                <TensorHighlight highlight={highlight}/>
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
