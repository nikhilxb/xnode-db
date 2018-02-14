import React, { Component } from 'react';

import { withStyles } from 'material-ui/styles';
import List, {ListItem} from 'material-ui/List';

const styles = {
    root: {

    }
};

/**
 * This class ___.
 */
class VarList extends Component {

    /**
     * Renders ___.
     */
    render() {
        return (
            <div className={this.props.classes.root}>
                <List>

                </List>
            </div>
        );
    }
}

export default withStyles(styles)(VarList);
