import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';
import { updateNamespaceActionThunk } from '../../../actions/program.js';

import List from 'material-ui/List';

import VarListItem from './VarListItem';

/**
 * This smart component displays a list of variables and their attributes. The list is recursively nested and
 * lazy-loaded, so the complete data is only requested for a variable when it is expanded. Before then, just a bit of
 * metadata (i.e. a "shell") is needed for proper display.
 *
 * The list may be very tall (has many elements), so users may want to wrap this component in a `div` with overflow
 * properties.
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
        const { classes, topLevelItemIds } = this.props;
        let listItems = topLevelItemIds.map(itemId => {
            return <VarListItem key={itemId} itemId={itemId} nestedlevel={0}/>;
        });

        return (
            <List className={classes.list} dense>
                {listItems}
            </List>
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    list: {
        backgroundColor: theme.palette.background.paper,
        paddingTop: 0,
        paddingBottom: 0,
    }
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
