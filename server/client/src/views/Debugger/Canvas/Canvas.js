import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import PropTypes from "prop-types";

import DataViewer from '../../../components/DataViewer/DataViewer.js';


/** Component styling object. */
const styles = theme => ({
    container: {
        minHeight: 600,
        padding: theme.spacing.unit * 4,
    }
});

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

    // TODO remove this, just for demo purposes
    componentDidMount() {
        let viewers = this.state.viewers;
        viewers.push(<DataViewer key={"@id:007"} symbolId={"@id:007"} loadSymbol={this.props.loadSymbol} isTopLevel={true} />)
        this.setState({
            viewers: viewers
        })
    }

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Renders ___.
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
