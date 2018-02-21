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

/**
 * This class renders a variable with value null in the Canvas.
 */
class ViewerFrame extends Component {
    render() {
        let { classes } = this.props;
        return (
            <Card className={classes.card}>
                <CardContent>
                    <div className={classes.header}>
                    <IconButton className={classes.button} aria-label="Computation Graph">
                      <TimelineIcon style={{width: 20, height: 20}}/>
                    </IconButton>
                  <Typography color="inherit" className={classes.title}>
                    {this.props.title}
                  </Typography>
                  <IconButton className={classes.button} aria-label="Close">
                    <CloseIcon style={{width: 20, height: 20}}/>
                  </IconButton>
              </div>
                      <Divider />
                    {this.props.children}
                </CardContent>
            </Card>
        );
    }
}

export default withStyles(styles)(ViewerFrame);
