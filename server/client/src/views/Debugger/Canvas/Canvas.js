import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import DataViewer from '../../../components/DataViewer/DataViewer.js';

const styles = {
    container: {
        backgroundColor: 'rgb(248, 248, 248)',
        display: 'flex',
        flexGrow: 1,
        textAlign: 'center',
    }
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
        viewers.push(<DataViewer key={"0"} symbolId={"0"} fetchShellAndData={this.props.fetchShellAndData} isTopLevel={true} />)
        this.setState({
            viewers: viewers
        })
    }

    render() {
       return (
           <div className={this.props.classes.container}>
               {this.state.viewers}
           </div>
       );
    }
}

export default withStyles(styles)(Canvas);
