import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import { graphlib } from 'dagre';

const styles = {
    root: {

    }
};

/**
 * This class renders an edge betweeen two nodes in a computation graph.
 */
class GraphEdge extends Component {
    render() {
        let points = this.props.points;
        let segments = [];
        for (let i=0; i < points.length - 1; i++) {
            segments.push([points[i], points[i+1]]);
        }
        let lineComponents = segments.map((segment, i) =>
            <Line key={i} x0={segment[0].x} y0={segment[0].y} x1={segment[1].x} y1={segment[1].y}/>
        );
        return lineComponents
    }
}

// Harvested from react-lineto almost verbatim, but changed to make positioning relative
// TODO clean this up to fit with our paradigms
class Line extends Component {
    render() {
        const { x0, y0, x1, y1 } = this.props;

        const dy = y1 - y0;
        const dx = x1 - x0;

        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const length = Math.sqrt(dx * dx + dy * dy);

        const positionStyle = {
            position: 'absolute',
            top: `${y0}px`,
            left: `${x0}px`,
            width: `${length}px`,
            zIndex: this.props.zIndex || '1',
            transform: `rotate(${angle}deg)`,
            // Rotate around (x0, y0)
            transformOrigin: '0 0',
        };

        const defaultStyle = {
            height: '1px',
            borderTop: this.props.border || '1px solid #f00',
        };

        const props = {
            className: this.props.className,
            style: Object.assign({}, defaultStyle, this.props.style, positionStyle),
        }

        // We need a wrapper element to prevent an exception when then
        // React component is removed. This is because we manually
        // move the rendered DOM element after creation.
        return (
            <div className="react-lineto-placeholder">
                <div
                    ref={(el) => { this.el = el; }}
                    {...props}
                 />
            </div>
        );
    }
}

export default withStyles(styles)(GraphEdge);
