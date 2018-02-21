import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';

import List, {ListItem, ListItemText, ListSubheader} from 'material-ui/List';
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

        /** An array of symbol IDs in the current frame namespace. Only IDs passed to this component, as it requests
         *  the data from the Debugger. */
        symbolIds: PropTypes.arrayOf(PropTypes.string),

        /** A function (symbolId, callback) to get the shell for a specified symbol ID. */
        getSymbolShell: PropTypes.func.isRequired,

        addViewerToCanvas: PropTypes.func.isRequired
    };

    static defaultProps = {
        /** See `propTypes`. */
        symbolIds: [],
    };

    /** Constructor. */
    constructor(props) {
        super(props);
        this.renderSymbol = this.renderSymbol.bind(this);
    }

    /**
     * Recursive function to construct a nested list of symbols.
     * TODO: Make recursive.
     * TODO: Limit the number of characters
     * @param symbolId Unique ID of the symbol to render, used by the Debugger's symbolTable.
     */
    renderSymbol(symbolId) {
        const {classes, getSymbolShell, addViewerToCanvas} = this.props;
        let shell = getSymbolShell(symbolId);
        if(shell === null || !shell.name) return null;

        return (
            <ListItem button onClick={(e) => addViewerToCanvas(symbolId)}>
                <ListItemText classes={{primary: classes.text}} primary={[
                    <span className={classes.varName}>{shell.name}</span>,
                    <span>&nbsp;:&nbsp;</span>,
                    <span className={classes.varString}>{shell.str}</span>
                ]} />
            </ListItem>
        );
    }

    /**
     * Renders a nested list of variable names and data (if expanded).
     */
    render() {
        const {classes, symbolIds} = this.props;

        return (
            <List className={classes.root}
                  dense={true}
                  disablePadding={true}>
                <ListSubheader className={classes.listSection}>Variables</ListSubheader>
                {symbolIds.map(this.renderSymbol)}
            </List>
        );
    }
}

export default withStyles(styles)(VarList);
