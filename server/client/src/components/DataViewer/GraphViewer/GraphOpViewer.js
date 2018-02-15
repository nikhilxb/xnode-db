import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import { graphlib } from 'dagre';

const styles = theme => ({
  button: {
      background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
      borderRadius: 3,
      border: 0,
      color: 'white',
      height: 100,
      width: 100,
      padding: '0 30px',
      boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .30)',
  },
  label: {
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
        return <Button classes={{root: this.props.classes.button, label: this.props.classes.label}}>{this.props.name ? this.props.name : this.props.str}</Button>
    }
}

export default withStyles(styles)(GraphOpViewer);
