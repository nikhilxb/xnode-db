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
import ColorLightBlue from "material-ui/colors/lightBlue";
import ColorBlue from "material-ui/colors/blue";

const kListItemWidth  = 80;
const kListItemHeight = 40;
const kListItemMargin = 2;


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
            selected: null,
        }
    }

    buildListComponents(classes, contents, symbolTable, addViewerToCanvas) {
        const { hover, selected } = this.state;
        return contents.map((ref, i) => {
            let str = ref;
            let onClick = () => {
                this.setState({
                    selected: i,
                })
            };
            let onDoubleClick = () => {};
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
                onDoubleClick = () => addViewerToCanvas(ref);
            }
            else {
                str = `"${str}"`;
            }

            return (
                <div className={classNames({
                    [classes.listItem]: true,
                    [classes.hover]: hover === i,
                    [classes.selected]: selected === i,
                })}
                     onClick={onClick}
                     onDoubleClick={onDoubleClick}
                     onMouseEnter={() => this.setState({hover: i})}
                     onMouseLeave={() => this.setState({hover: null})}
                     key={i}>
                    <Typography className={classes.listItemText}>{str}</Typography>
                </div>
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
        return (
            <div className={classes.container} >
                <div className={classes.listBox}>
                    <div className={classes.list}>
                        {listItems}
                    </div>
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
        margin: kListItemMargin,
        width:  kListItemWidth,
        height: kListItemHeight,
        background: ColorLightBlue[50],
        borderColor: 'transparent',
        borderStyle: 'solid',
        borderRadius: 4,

        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        userSelect: 'none',
    },
    hover: {
        borderColor: ColorLightBlue[400],
    },
    selected: {
        borderColor: ColorBlue[600],
    },
    listItemText: {
        textAlign:      'center',
        overflow:       'hidden',
        textOverflow:   'ellipsis',
        whiteSpace:     'nowrap',
        textTransform:  'none',
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
function makeMapStateToProps() {  // Second argument `props` is manually set prop
    return (state, props) => {
        return {
            symbolTable: state.program.symbolTable,  // TODO make a selector for only relevant portions of the symbol table
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
