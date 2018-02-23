import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';
import { addViewerActionThunk } from '../../../actions/canvas.js';
import { toggleVarListItemExpandedActionThunk } from '../../../actions/varlist.js';

import List, {ListItem, ListItemText, ListSubheader} from 'material-ui/List';
import Collapse from 'material-ui/transitions/Collapse';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import { LinearProgress } from 'material-ui/Progress';
import ExpandLess from 'material-ui-icons/ExpandLess';
import ExpandMore from 'material-ui-icons/ExpandMore';
import blueGrey from 'material-ui/colors/blueGrey';
import {createSelector} from "reselect";

/** Component styling object. */
const styles = theme => ({
    root: {
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        backgroundColor: theme.palette.background.paper,
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
    expandButton: {
        height: '100%',
        width: 'auto',
    }
});


class VarListItem extends Component {
    render() {
        let { itemId, classes, onExpandClick, onButtonClick, nestedlevel, str } = this.props;
        let { name, symbolId, payload, expanded, loading, children } = this.props.itemInfo;
        let varString = payload === null ? (str === null ? symbolId : str) : payload;
        let childComponents = [];
        if (children) {
            childComponents = children.map(childId => {
                return <ConnectedVarListItem nestedlevel={nestedlevel + 1} key={childId} itemId={childId}/>;
            })
        }
        return (
            // TODO make indentation cleaner
            <div>
                <ListItem button onClick={() => onButtonClick(symbolId)} style={{paddingLeft: nestedlevel * 30}}>
                    <span className={classes.text}>
                        <span className={classes.varName}>{name}</span>
                        <span className={classes.varSeparator}>&nbsp;&nbsp;:&nbsp;&nbsp;</span>
                        <span className={classes.varString}>{varString}</span>
                    </span>
                    <IconButton className={classes.expandButton} onClick={(e) => {e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); onExpandClick(itemId);} }>
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </ListItem>
                <Divider/>
                {loading && <LinearProgress/>}
                <Collapse in={expanded} timeout="auto">
                    <List className={classes.root} disablePadding dense>
                    {childComponents}
                </List>
                </Collapse>
            </div>
        );
    }
}

const getSymbolId = (state, props) => state.varlist.varListItems[props.itemId].symbolId;

const getSymbolTable = (state) => state.symboltable;

function makeGetVarListItemStr() {
    return createSelector(
        [ getSymbolId, getSymbolTable ],
        (symbolId, symbolTable) => {
            if (symbolId in symbolTable) {
                return symbolTable[symbolId].str;
            }
            else {
                return null;
            }
        }
    )
}

// Inject styles and data into component
function makeMapStateToProps() {
    const getVarListItemStr = makeGetVarListItemStr();
    return (state, props) => {
        return {
            str: getVarListItemStr(state, props),
            itemInfo: state.varlist.varListItems[props.itemId],
        }
    }
}
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        onExpandClick: toggleVarListItemExpandedActionThunk,
        onButtonClick: addViewerActionThunk,
    }, dispatch);
}

const ConnectedVarListItem = connect(makeMapStateToProps, mapDispatchToProps)(withStyles(styles)(VarListItem));
export default ConnectedVarListItem;
