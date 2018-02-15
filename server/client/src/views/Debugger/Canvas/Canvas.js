import React, { Component } from 'react';

// Material UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { withStyles } from 'material-ui/styles';
import createMuiTheme from 'material-ui/styles/createMuiTheme';
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
        viewers.push(<DataViewer key={"0"} symbolId={"0"} fetchShellAndData={this.props.fetchShellAndData} isTopLevel={true} />)
        this.setState({
            viewers: viewers
        })
    }

    render() {
        return <div>{this.state.viewers}</div>
    }
}

export default withStyles(styles)(Canvas);
