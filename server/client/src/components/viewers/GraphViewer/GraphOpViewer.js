import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Typography from 'material-ui/Typography';

const styles = theme => ({
  card: {
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
            <Card className={this.props.classes.card}>
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
