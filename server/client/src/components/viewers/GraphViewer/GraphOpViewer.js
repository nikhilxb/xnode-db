import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Typography from 'material-ui/Typography';
import { nodeHeight, nodeWidth } from './GraphViewer.js';

const styles = theme => ({
  card: {
      height: nodeHeight,
      width: nodeWidth,
  },
  label: {
      textAlign: 'center',
  }
});

/**
 * This class renders an op node in a computation graph.
 */
class GraphOpViewer extends Component {
    render() {
        return (
            <Card className={this.props.classes.card} style={{position: "absolute", top: this.props.y, left: this.props.x}}>
                <CardContent>
                    <Typography component="p" className={this.props.classes.label}>
                        {this.props.symbolId}
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}

export default withStyles(styles)(GraphOpViewer);
