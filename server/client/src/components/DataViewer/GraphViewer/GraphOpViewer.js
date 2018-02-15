import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Typography from 'material-ui/Typography';
import { graphlib } from 'dagre';
import { nodeHeight, nodeWidth } from './GraphViewer.js';

const styles = theme => ({
  card: {
      height: nodeHeight,
      width: nodeWidth,
  },
  label: {
      textAlign: 'center',
      textTransform: 'capitalize',
  }
});

/**
 * This class ___.
 */
class GraphOpViewer extends Component {
    constructor(props, context) {
        super(props, context);
        this.props.data.viewer.args.forEach(arg =>
            this.props.buildDAG(arg, this.props.symbolId)
        );
        Object.keys(this.props.data.viewer.kwargs).forEach(kwarg =>
            this.props.buildDAG(this.props.data.viewer.kwargs[kwarg], this.props.symbolId)
        );
    }

    render() {
        return (<Card className={this.props.classes.card}>
            <CardContent>
                <Typography component="p" className={this.props.classes.label}>
                    {this.props.name ? this.props.name : this.props.str}
                </Typography>
            </CardContent>
        </Card>);
    }
}

export default withStyles(styles)(GraphOpViewer);
