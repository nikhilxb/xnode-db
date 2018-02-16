import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import GraphViewer from './GraphViewer/GraphViewer.js'
import GraphDataViewer from './GraphViewer/GraphDataViewer.js'
import GraphOpViewer from './GraphViewer/GraphOpViewer.js'

const styles = theme => ({

});

/**
 * This class requests data for a single symbol and then renders its type-specific viewer.
 */
class DataViewer extends Component {
    /**
     * Initialize the state with an empty "body" value, which will be filled in with a type-specific component after
     * loading the symbol's information.
     */
    constructor(props, context) {
        super(props, context);
        this.state = {
            body: <div />,
        };
    }

    /**
     * When the component mounts and we can update the state, ask the Debugger to load the DataViewer's associated
     * symbol. When the data is returned, create a body component to show information for that symbol.
     */
    componentDidMount() {
        this.props.loadSymbol(this.props.symbolId, (shellAndData) => {
            let newComponent = null;
            if (shellAndData.type === "graphdata" && this.props.isTopLevel === true) {
                newComponent = (<GraphViewer {...shellAndData} {...this.props} />);
            }
            else if (shellAndData.type === "graphdata") {
                newComponent = (<GraphDataViewer {...shellAndData} {...this.props} />);
            }
            else if (shellAndData.type === "graphop") {
                newComponent = (<GraphOpViewer {...shellAndData} {...this.props} />);
            }
            this.setState({
                body: newComponent,
            });
        });
    }

    /**
     * Renders the type-specific component, if loaded.
     */
    render() {
        return <div>{this.state.body}</div>
    }
}

export default withStyles(styles)(DataViewer);
