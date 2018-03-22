import React, { Component, PureComponent } from 'react';
import { withStyles } from 'material-ui/styles';
import Icon from 'material-ui/Icon';
import IconButton from 'material-ui/IconButton';
import Tooltip from 'material-ui/Tooltip';
import CompareArrowsIcon from 'material-ui-icons/CompareArrows';
import PropTypes from 'prop-types';
import { scaleLinear, color } from 'd3';
import { XYPlot, XAxis, YAxis, HorizontalGridLines, VerticalGridLines, AreaSeries, LineSeries } from 'react-vis';


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
            distribution: this.generateDistribution(props.payload),
            highlight: null,
            mode: 'elements',
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
        const [ROWS, COLS] = [contents.length, contents[0].length];
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
                    value: contents[r][c],
                    color: COLOR(scale),
                });
            }
        }

        return { pixels: pixels, width: JUMP * COLS, height: JUMP * ROWS };
    }

    flattenArray(array, flattened=[]) {
        for (let i = 0; i < array.length; i++) {
            if (array[i].constructor === Array) {
                flattened.concat(this.flattenArray(array[i], flattened));
            }
            else {
                flattened.push(array[i]);
            }
        }
        return flattened;
    }

    generateDistribution(payload) {
        const { contents } = payload;
        const flattened = this.flattenArray(contents);
        const min = Math.min(...flattened);
        const max = Math.max(...flattened);
        const numBuckets = Math.ceil(Math.log(flattened.length));
        const bucketCounts = Array.apply(null, Array(numBuckets + 1)).map(Number.prototype.valueOf, 0);
        const iToBucket = (i) => min + (i) * (max - min) / numBuckets;
        flattened.forEach(value => {
            for (let i = 0; i < numBuckets; i++) {
                if (value < iToBucket(i)) {
                    bucketCounts[i] += 1;
                    break;
                }
            }
        });
        return bucketCounts.map((count, i) => {return {x: iToBucket(i), y: count}});
    }

    switchViews() {
        const { mode } = this.state;
        mode === 'distribution' ? this.setState({mode: 'elements'}) : this.setState({mode: 'distribution'});
    }

    /** Renders the pixels and highlight elements in an svg. */
    render() {
        const { classes } = this.props;
        const { elements, highlight, distribution, mode } = this.state;
        const { pixels, width, height } = elements;

        let contents = null;
        if (mode === 'elements') {
            contents = (
                <div>
                    <svg width={width + 2*PADDING} height={height + 2*PADDING}
                         viewBox={`${-PADDING} ${-PADDING} ${width + 2*PADDING} ${height + 2*PADDING}`}>
                        <TensorPixels pixels={pixels} handleHighlight={this.handleHighlight.bind(this)} />
                        <TensorHighlight highlight={highlight} />
                    </svg>
                    <div style={{color: highlight ? color(highlight.color).darker() : '#FFF'}}>
                        {highlight ? highlight.value.toPrecision(4) : '-'}
                    </div>
                </div>
            );
        }
        else if (mode === 'distribution') {
            contents = (
                <XYPlot
                    width={300}
                    height={300}>
                    <XAxis title={'Tensor Value'}/>
                    <YAxis title={'Appearances in Tensor'}/>
                    <VerticalGridLines />
                    <HorizontalGridLines />
                    <AreaSeries
                        color={'#f4a653'}
                        opacity={0.3}
                        curve={'curveMonotoneX'}
                        data={distribution}/>
                    <LineSeries
                        color={'#f4a653'}
                        curve={'curveMonotoneX'}
                        data={distribution}/>
                </XYPlot>
            );
        }

        return (
          <div className={classes.container}>
              {contents}
              <Tooltip title="Change View" placement="bottom">
                  <IconButton onClick={() => this.switchViews()} aria-label="Change View">
                      <CompareArrowsIcon />
                  </IconButton>
              </Tooltip>
          </div>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    container: {
        margin: 'auto',
        overflow: 'auto',
        width: '100%',
    }
});

export default withStyles(styles)(TensorViewer);
