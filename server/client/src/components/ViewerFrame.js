import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Card, { CardActions, CardContent } from 'material-ui/Card';
import Toolbar from 'material-ui/Toolbar';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import CloseIcon from 'material-ui-icons/Close';
import TimelineIcon from 'material-ui-icons/Timeline';
import Typography from 'material-ui/Typography';
import Divider from 'material-ui/Divider';
import PropTypes from "prop-types";


/**
 * This dump component creates a window that houses a single top-level viewer component, which populates the window
 * contents. TODO: Extend features to allow reshuffling of ViewerFrames on Canvas.
 */
class ViewerFrame extends Component {

    /** Prop expected types object. */
    static propTypes = {
        children: PropTypes.array,
        classes:  PropTypes.object.isRequired,
        key:      PropTypes.number.isRequired,
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
            <Card className={classes.card}>
                <CardContent>
                    <div className={classes.header}>
                        <IconButton className={classes.button}>
                            <TimelineIcon style={{width: 20, height: 20}}/>
                        </IconButton>
                        <Typography color="inherit" className={classes.title}>
                            {name ? name + " " + type : type}
                        </Typography>
                        <IconButton className={classes.button} aria-label="Close"
                                    onClick={() => removeViewerFn(viewerId)}>
                            <CloseIcon style={{width: 20, height: 20}}/>
                        </IconButton>
                    </div>
                    <Divider />
                    {children}
                </CardContent>
            </Card>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    card: {
        textAlign: 'center',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        height: 15,
        width: 15,
    },
    title: {
        color: theme.palette.text.secondary,
        flex: 1,
    },
});

export default withStyles(styles)(ViewerFrame);
