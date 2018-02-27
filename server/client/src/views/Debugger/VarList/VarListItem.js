import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from "reselect";

import { addViewerActionThunk } from '../../../actions/canvas';
import { toggleVarListItemExpandedActionThunk } from '../../../actions/varlist';

import List, {ListItem, ListItemIcon, ListItemSecondaryAction} from 'material-ui/List';
import Collapse from 'material-ui/transitions/Collapse';
import IconButton from 'material-ui/IconButton';
import { LinearProgress } from 'material-ui/Progress';
import blueGrey from 'material-ui/colors/blueGrey';

import OpenInNewIcon from 'material-ui-icons/OpenInNew';
import SearchIcon from 'material-ui-icons/Search';
import AddIcon from 'material-ui-icons/Add';
import InsertChartIcon from 'material-ui-icons/InsertChart';
import DropDownIcon from 'material-ui-icons/ArrowDropDown';


/**
 * This smart component
 */
class VarListItem extends Component {

    /**
     * Renders the list item for the variable, as well as a collapsible sub-list of nested variables. Clicking the
     * main button toggles whether the sublist is expanded. Clicking the icon button, adds a viewer for the variable
     * to the canvas.
     */
    render() {
        let { itemId, classes, toggleExpandedFn, addViewerFn, nestedlevel, str } = this.props;
        let { name, symbolId, payload, expanded, loading, children } = this.props.itemInfo;
        let varString = payload === null ? (str === null ? symbolId : str) : payload;
        let childComponents = (!children) ? [] : children.map(childId => {
            return <ConnectedVarListItem nestedlevel={nestedlevel + 1} key={childId} itemId={childId}/>;
        });

        const handleExpandClick = (e) => {
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();
            toggleExpandedFn(itemId);
        };

        const handleAddViewerClick = () => {
            addViewerFn(symbolId);
        };

        return (
            <div>
                <ListItem button onClick={handleExpandClick}
                          classes={{dense: classes.dense}}
                          style={{paddingLeft: nestedlevel * 24 + 8}}>
                    <ListItemIcon onClick={handleExpandClick} className={classes.arrows}>
                        {expanded ? <DropDownIcon/> : <DropDownIcon className={classes.rotated}/>}
                    </ListItemIcon>
                    <span className={classes.text}>
                        <span className={classes.varName}>{name || "(unnamed)"}</span>
                        <span className={classes.varSeparator}>:&nbsp;</span>
                        <span className={classes.varString}>{varString}</span>
                    </span>
                    <ListItemSecondaryAction>
                        <IconButton aria-label="Add Viewer" onClick={handleAddViewerClick}>
                            <SearchIcon/>
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
                {loading && <LinearProgress/>}
                <Collapse in={expanded} timeout={50}>
                    <List className={classes.root} dense>
                        {childComponents}
                    </List>
                </Collapse>
            </div>
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
    },
    dense: {
        paddingTop: 4,
        paddingBottom: 4,
    },
    text: {
        fontFamily: '"Roboto Mono", monospace',
        overflow:'hidden',
        textOverflow:'ellipsis',
        whiteSpace:'nowrap',
        width: '100%',
        fontSize: '0.8em',
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
    arrows: {
        marginRight: 4,
    },
    rotated: {
        transform: "rotate(-90deg)",
    }
});


// To inject application state into component
// ------------------------------------------

/**
 * Creates function to create derived data structure for `str`: "hello".
 */
function getItemStrSelectorGen() {
    return createSelector(
        [
            (state, props) => state.varlist.varListItems[props.itemId].symbolId,
            (state) => state.symboltable,
        ],
        (symbolId, symbolTable) => {
            return (symbolId in symbolTable) ? symbolTable[symbolId].str : null;
        }
    )
}

/** Connects application state objects to component props. */
function mapStateToPropsGen() {
    const getItemStr = getItemStrSelectorGen();
    return (state, props) => {
        return {
            str: getItemStr(state, props),
            itemInfo: state.varlist.varListItems[props.itemId],
        }
    }
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        toggleExpandedFn: toggleVarListItemExpandedActionThunk,
        addViewerFn: addViewerActionThunk,
    }, dispatch);
}

const ConnectedVarListItem = connect(mapStateToPropsGen, mapDispatchToProps)(withStyles(styles)(VarListItem));
export default ConnectedVarListItem;
