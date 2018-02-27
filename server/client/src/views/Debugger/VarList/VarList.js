import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';
import { updateNamespaceActionThunk } from '../../../actions/symboltable.js';

import List, {ListItem, ListItemText, ListSubheader} from 'material-ui/List';
import VarListItem from './VarListItem.js';
import blueGrey from 'material-ui/colors/blueGrey';


/**
 * This smart component displays a list of all variables in the debugged program's namespace when execution is paused
 * (e.g. at a breakpoint). The list is recursively nested and lazy-loaded, so only on expansion will data requested.
 */
class VarList extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
        topLevelItemIds: PropTypes.array.isRequired,
        getNamespace: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.props.getNamespace();
    }

    /**
     * Renders a nested list of variable names and data (if expanded).
     */
    render() {
        const {classes, topLevelItemIds} = this.props;
        let listItems = topLevelItemIds.map(itemId => {
            return <VarListItem key={itemId} itemId={itemId} nestedlevel={0}/>;
        });

        return (
            <List className={classes.root} dense>
                <ListSubheader className={classes.listSection}>Variables</ListSubheader>
                {listItems}
            </List>
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    root: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
        paddingTop: 0,
        paddingBottom: 0,
    },
});


// To inject application state into component
// ------------------------------------------

/** Connects application state objects to component props. */
function mapStateToProps(state) {
    return {
        topLevelItemIds: state.varlist.topLevelItemIds,
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getNamespace: updateNamespaceActionThunk,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(VarList));
