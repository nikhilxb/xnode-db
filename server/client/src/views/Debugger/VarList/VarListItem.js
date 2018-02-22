import React, { Component } from 'react';
import PropTypes from "prop-types";
import { withStyles } from 'material-ui/styles';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';
import { toggleVarListItemExpanded } from '../../../actions/varlist.js';
import { makeGetVarListItemStr } from '../../../selectors/varlist.js';

import List, {ListItem, ListItemText, ListSubheader} from 'material-ui/List';
import Collapse from 'material-ui/transitions/Collapse';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import { LinearProgress } from 'material-ui/Progress';
import ExpandLess from 'material-ui-icons/ExpandLess';
import ExpandMore from 'material-ui-icons/ExpandMore';
import blueGrey from 'material-ui/colors/blueGrey';

/** Component styling object. */
const styles = theme => ({
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
    varKey: {

    }
});


class VarListItem extends Component {
    render() {
        let { itemId, classes, onExpandClick, nestedlevel, str } = this.props;
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
                <ListItem button style={{paddingLeft: nestedlevel * 15}}>
                    <span className={classes.text}>
                        <span className={classes.varName}>{name}</span>
                        <span className={classes.varSeparator}>&nbsp;&nbsp;:&nbsp;&nbsp;</span>
                        <span className={classes.varString}>{varString}</span>
                    </span>
                    <IconButton onClick={(e) => {e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); onExpandClick(itemId);} }>
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </ListItem>
                <Divider/>
                {loading && <LinearProgress/>}
                <Collapse in={expanded} timeout="auto">
                    <List component="div" disablePadding>
                    {childComponents}
                </List>
                </Collapse>
            </div>
        );
    }
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
function mapDispatchToProps(dispatch, props) {
    return bindActionCreators({
        onExpandClick: toggleVarListItemExpanded,
    }, dispatch);
}

const ConnectedVarListItem = connect(makeMapStateToProps, mapDispatchToProps)(withStyles(styles)(VarListItem));
export default ConnectedVarListItem;
