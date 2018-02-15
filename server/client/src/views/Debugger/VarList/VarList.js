import React, { Component } from 'react';

import { withStyles } from 'material-ui/styles';
import List, {ListItem, ListItemText} from 'material-ui/List';

const styles = {
    container: {
        maxWidth: '350px',
        width: '100%',
        fontFamily: 'monospace',
    },

};

/**
 * This component displays a list of all variables in the debugged program's namespace when execution is paused
 * (e.g. at a breakpoint). The list is recursively nested and lazy-loaded, so only on expansion will
 */
class VarList extends Component {

    myfunction(param) {

    }

    /**
     * Renders ___.
     */
    render() {
        return (
            <div className={this.props.classes.container}>
                <List dense={true}>
                    <ListItem button>
                        <ListItemText primary="Herro" />
                    </ListItem>
                </List>
            </div>
        );
    }
}

export default withStyles(styles)(VarList);
