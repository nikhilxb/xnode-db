import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import GraphViewer from './GraphViewer/GraphViewer.js'
import GraphDataViewer from './GraphViewer/GraphDataViewer.js'
import GraphOpViewer from './GraphViewer/GraphOpViewer.js'

const styles = {
};

/**
 * This class ___.
 */
class DataViewer extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            body: <div />,
        }
    }
    componentDidMount() {
        this.props.fetchShellAndData(this.props.symbolId, (shellAndData) => {
            let newComponent = null;
            if (shellAndData.type === "graphdata" && this.props.isTopLevel === true) {
                console.log('Rendering graphdata head');
                newComponent = <GraphViewer {...shellAndData} {...this.props}/>;
            }
            else if (shellAndData.type === "graphdata") {
                console.log('Rendering graphdata');
                newComponent = <GraphDataViewer {...shellAndData} {...this.props} />;
            }
            else if (shellAndData.type === "graphop") {
                console.log('Rendering graphop');
                newComponent = <GraphOpViewer {...shellAndData} {...this.props}/>;
            }
            this.setState({
                body: newComponent,
            });
        });
    }
    /**
     * Request that the canvas create a new viewer for the given symbol. Should
     * also handle any logic that links this viewer to the new one.
     */
    openNewViewer(symbolId) {
        // TODO opening new viewers
    }

    /**
     * Renders ___.
     */
    render() {
        return <div>{this.state.body}</div>
    }
}

export default withStyles(styles)(DataViewer);
