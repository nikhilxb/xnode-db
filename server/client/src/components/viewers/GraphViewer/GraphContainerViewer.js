import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Paper from 'material-ui/Paper';

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
class GraphContainerViewer extends Component {
    render() {
        let { toggleExpanded, symbolId } = this.props;
        return (
            <Paper style={{background:'#333', opacity:0.33, height:'100%', width:'100%'}} onClick={() => toggleExpanded(symbolId)}/>
        );
    }
}

export default withStyles(styles)(GraphContainerViewer);
