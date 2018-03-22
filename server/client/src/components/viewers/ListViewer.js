import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from 'material-ui/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from "reselect";

import { addViewerActionThunk, removeViewerAction, updateLayoutAction } from "../../actions/canvas";
import { REF } from '../../services/mockdata.js';

import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';

const kListItemWidth = 60;
const kListItemMargin = 5;


/**
 * This smart component renders an sequence variable (tuple, list, set).
 */
class ListViewer extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes:    PropTypes.object.isRequired,
        symbolId:   PropTypes.string.isRequired,
        viewerId:   PropTypes.number.isRequired,
        str:        PropTypes.string.isRequired,
        payload:    PropTypes.object.isRequired,
    };

    /** Constructor. */
    constructor(props) {
        super(props);
        this.state = {
            hover: null,
        }
    }

    buildListComponents(classes, contents, symbolTable, addViewerToCanvas) {
        return contents.map((ref, i) => {
            let str = ref;
            let onClick = () => {};
            if (ref === null) {
                str = 'None';
            }
            else if (typeof ref === 'number') {
                str = `${ref}`;
            }
            else if (typeof ref === 'boolean') {
                str = ref ? 'True' : 'False';
            }
            else if (ref.startsWith(REF)) {
                str = symbolTable[ref].str;
                onClick = () => addViewerToCanvas(ref);
            }
            else {
                str = `"${str}"`;
            }
            return (
                <Button
                    variant={'raised'}
                    className={classes.listItem}
                    onClick={onClick}
                    onMouseEnter={() => this.setState({hover: str})}
                    onMouseLeave={() => this.setState({hover: null})}
                    key={i}>
                    <Typography
                        component="span"
                        className={classes.listItemText}>
                        {str}
                    </Typography>
                </Button>
            );
        });
    }

    /**
     * Renders the list, with each item being a fixed-width button. When clicked, the button opens the viewer, if
     * the clicked entry is a non-primitive.
     */
    render() {
        const { classes, payload, symbolTable, addViewerToCanvas } = this.props;
        const { contents } = payload;
        const { hover } = this.state;
        let listItems = this.buildListComponents(classes, contents, symbolTable, addViewerToCanvas);
        // const contentWidth = listItems.length * (kListItemWidth + kListItemMargin * 2);
        // const listOffset = this.rootElem ? Math.max(0, (this.rootElem.offsetWidth - contentWidth) / 2) : 0;
        return (
            <div className={classes.container} >
                <div className={classes.listBox}>
                    <div className={classes.list}>
                        {listItems}
                    </div>
                </div>
                <div className={classes.tooltip}>
                    <span className={classes.tooltipStr}>{hover ? hover : '-'}</span>
                </div>
            </div>
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    container: {
        width: '100%',
        margin: 'auto',  // center vertically

        display: 'flex',
        flexDirection: 'column',
    },
    listBox: {
        overflow: 'auto',
        textAlign: 'center',
        paddingTop: 16,
        paddingBottom: 16,
    },
    list : {
        display: 'inline-flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
    },
    listItem: {
        margin: `${kListItemMargin}px`,
        width: `${kListItemWidth}px`,
    },
    listItemText: {
        textAlign:'center',
        overflow:'hidden',
        textOverflow:'ellipsis',
        whiteSpace:'nowrap',
        textTransform: 'none',
    },
    tooltip: {

    },
    tooltipStr: {

    },
    tooltipDetail: {
        fontStyle: 'italic'
    }
});


// To inject application state into component
// ------------------------------------------

/** Connects application state objects to component props. */
function makeMapStateToProps(state, props) {  // Second argument `props` is manually set prop
    return (state, props) => {
        return {
            symbolTable:    state.symboltable,  // TODO make a selector for only relevant portions of the symbol table
        };
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        addViewerToCanvas:  addViewerActionThunk,
    }, dispatch);
}

export default connect(makeMapStateToProps, mapDispatchToProps)(withStyles(styles)(ListViewer));
