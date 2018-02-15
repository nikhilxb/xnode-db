import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import DataViewer from '../../../components/DataViewer/DataViewer.js';

const styles = {
};

/**
 * This class ___.
 */
class Canvas extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            viewers: [],
        }
    }

    componentDidMount() {
        let viewers = this.state.viewers;
        viewers.push(<DataViewer key={"0"} symbolId={"0"} loadSymbol={this.props.loadSymbol} isTopLevel={true} />)
        this.setState({
            viewers: viewers
        })
    }

    render() {
       return (
           <div>
               {this.state.viewers}
           </div>
       );
    }
}

export default withStyles(styles)(Canvas);
