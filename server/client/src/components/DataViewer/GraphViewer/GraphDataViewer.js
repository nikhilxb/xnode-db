import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';
import { graphlib } from 'dagre';

const styles = theme => ({
  card: {
      height: 75,
      width: 100,
  },
  label: {
      textAlign: 'center',
      textTransform: 'capitalize',
  }
});

/**
 * This class ___.
 */
class GraphDataViewer extends Component {
    constructor(props, context) {
        super(props, context);
        this.props.buildDAG(this.props.data.viewer.creatorop, this.props.symbolId);
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

export default withStyles(styles)(GraphDataViewer);
