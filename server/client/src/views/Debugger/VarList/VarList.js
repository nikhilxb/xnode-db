import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';

import List, {ListItem, ListItemText, ListSubheader} from 'material-ui/List';
import grey from 'material-ui/colors/grey';
import blueGrey from 'material-ui/colors/blueGrey';

/** Component styling object. */
const styles = theme => ({
    root: {
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

        /** An array of symbol IDs in the current frame namespace. Only IDs passed to this component, as it requests
         *  the data from the Debugger. */
        symbols: PropTypes.arrayOf(PropTypes.string),
    };

    static defaultProps = {
        /** See `propTypes`. */
        symbols: [],
    };

    /**
     * Recursive function to construct a nested list of symbols.
     * TODO: Make recursive.
     * @param symbolID Unique ID of the symbol to render, used by the Debugger's symbolTable.
     */
    renderSymbol(symbolID) {
        const {classes} = this.props;

        return (
            <ListItem button>
                <ListItemText classes={{primary: classes.text}} primary={[
                    <span className={classes.varName}>{symbolID}</span>,
                    <span className>&nbsp;:&nbsp;</span>,
                    <span className={classes.varString}>List[5]</span>
                ]} />
            </ListItem>
        );
    }

    /**
     * Renders a nested list of variable names and data (if expanded).
     */
    render() {
        const {classes, symbols} = this.props;

        return (
            <List className={classes.root}
                  dense={true}
                  disablePadding={true}>
                <ListSubheader>Variables</ListSubheader>
                {symbols.map(symbolID => this.renderSymbol(symbolID))}
            </List>
        );
    }
}

export default withStyles(styles)(VarList);
