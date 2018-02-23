import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';
import { updateNamespace } from '../../../actions/symboltable.js';

import List, {ListItem, ListItemText, ListSubheader} from 'material-ui/List';
import VarListItem from './VarListItem.js';
import blueGrey from 'material-ui/colors/blueGrey';

/** Component styling object. */
const styles = theme => ({
    root: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
    },
    listSection: {
        backgroundColor: 'inherit',
    },
    text: {
        fontFamily: '"Roboto Mono", monospace',
    },
    varName: {
        fontWeight: 800,
    },
    varSeparator: {
        fontWeight: 800,
    },
    varString: {
        color: blueGrey[500],
    },
    varKey: {

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
    }; // TODO: Update

    constructor(props) {
        super(props);
        this.props.getNamespace();
    }

    /**
     * Renders a nested list of variable names and data (if expanded).
     */
    render() {
        const {classes, topLevelItemIds} = this.props;
        let listItems = topLevelItemIds.map(itemId => <VarListItem key={itemId} itemId={itemId} nestedlevel={0}/>);
        return (
            <List className={classes.root} dense disablePadding>
                <ListSubheader className={classes.listSection}>Variables</ListSubheader>
                {listItems}
            </List>
        );
    }
}

// Inject styles and data into component
function mapStateToProps(state, props) {
    return {
        topLevelItemIds: state.varlist.topLevelItemIds,
    };
}
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getNamespace: updateNamespace,
    }, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(VarList));
