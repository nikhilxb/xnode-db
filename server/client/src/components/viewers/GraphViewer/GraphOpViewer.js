import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Paper from 'material-ui/Paper';
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
            <Paper style={{background:'#75CE8A', height:'100%', width:'100%'}}  className={this.props.classes.card}>
            </Paper>
        );
    }
}

export default withStyles(styles)(GraphOpViewer);
