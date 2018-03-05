import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import { nodeHeight, nodeWidth } from './GraphViewer.js';

const styles = theme => ({
    card: {
    },
    label: {
        textAlign: 'center',
    }
});
/**
 * This class renders a data node in a computation graph.
 */
class GraphDataViewer extends Component {
    render() {
        return (
            <Paper style={{background:'#798DEC', height:'100%', width:'100%'}}  className={this.props.classes.card}>
            </Paper>
        );
    }
}

export default withStyles(styles)(GraphDataViewer);
