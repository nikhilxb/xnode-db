import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";

import DataViewer from '../../../components/DataViewer/DataViewer.js';


/** Component styling object. */
const styles = theme => ({
    container: {
        flexGrow: 1,
        padding: theme.spacing.unit * 4,
    }
});

/**
 * This component serves as an interactive workspace for inspecting variable viewers.
 */
class Canvas extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            viewers: [],
        }
    }

    //    let viewers = this.state.viewers;
    //    viewers.push(<DataViewer key={"1766992443720"} symbolId={"1766992443720"} loadSymbol={this.props.loadSymbol} isTopLevel={true} />)

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Renders the inspector canvas and any viewers currently registered to it.
     */
    render() {
        const {classes} = this.props;

        return (
            <div className={classes.container}>
                {this.state.viewers}
            </div>
        );
    }
}

export default withStyles(styles)(Canvas);
