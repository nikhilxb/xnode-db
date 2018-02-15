import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';

import List, {ListItem, ListItemText, ListSubheader} from 'material-ui/List';
import PropTypes from "prop-types";


/** Component styling object. */
const styles = theme => ({
    root: {
        fontFamily: 'monospace',
    },
    item: {
        fontFamily: 'monospace',
    }
});

/**
 * This component displays a list of all variables in the debugged program's namespace when execution is paused
 * (e.g. at a breakpoint). The list is recursively nested and lazy-loaded, so only on expansion will data requested.
 */
class VarList extends Component {

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
            <List className={classes.root}
                  dense={true}
                  disablePadding={true}>
                <ListSubheader>Variables</ListSubheader>
                <ListItem button>
                    <ListItemText className={classes.item} primary="Herro" />
                </ListItem>
            </List>
        );
    }
}

export default withStyles(styles)(VarList);
