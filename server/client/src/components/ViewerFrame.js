import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';

import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';


/**
 * This dump component creates a window that houses a single top-level viewer component, which populates the window
 * contents. TODO: Extend features to allow reshuffling of ViewerFrames on Canvas.
 */
class ViewerFrame extends Component {

    /** Prop expected types object. */
    static propTypes = {
        children: PropTypes.object,
        classes:  PropTypes.object.isRequired,
        viewerId: PropTypes.number.isRequired,
        type:     PropTypes.string.isRequired,
        name:     PropTypes.string.isRequired,
    };

    /**
     * Renders a frame with a close button, and any of the component's children..
     */
    render() {
        const { classes, children, name, type, viewerId, removeViewerFn } = this.props;
        return (
            <Paper className={classes.container}>
                <div className={classes.header}>
                    <span className={classes.title}>
                        {`${name ? name + " " : ""}[${type}]`}
                    </span>
                    <IconButton className={classes.button} aria-label="Close"
                                onClick={() => removeViewerFn(viewerId)}>
                        <CloseIcon style={{width: 15, height: 15, color: '#FFFFFF'}}/>
                    </IconButton>
                </div>
                <div className={classes.content}>
                    <div className={classes.children}>
                        {children}
                    </div>
                </div>
            </Paper>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    container: {
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        background: '#232323',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        minHeight: 15,
    },
    content: {
        overflow: 'auto',
    },
    button: {
        height: 15,
        width: 15,
    },
    title: {
        flex: 1,
        fontFamily: '"Roboto Mono", monospace',
        color: '#FFFFFF',
        fontSize: '9pt',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
});

export default withStyles(styles)(ViewerFrame);
