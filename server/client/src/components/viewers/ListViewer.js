import React, { Component } from 'react';
import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Typography from 'material-ui/Typography';
import {connect} from "react-redux";
import {addViewerActionThunk, removeViewerAction, updateLayoutAction} from "../../actions/canvas";
import {bindActionCreators} from "redux";
import { REF } from '../../services/mockdata.js';
import Tooltip    from 'material-ui/Tooltip';
import {color} from "d3";

const listItemWidth = 60;
const listItemMargin = 5;

const styles = theme => ({
    root: {
        width: '100%',
        height: '100%',
        margin: 'auto 0',
        overflow: 'auto',
    },
    list : {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        justifyContent: 'left',
        height: '100%',
    },
    listItem: {
        margin: `${listItemMargin}px`,
        width: `${listItemWidth}px`,
        minWidth: `${listItemWidth}px`,
        maxWidth: `${listItemWidth}px`,
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

/**
 * This class renders a list variable in the Canvas.
 */
class ListViewer extends Component {
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

    render() {
        const { classes, payload, symbolTable, addViewerToCanvas } = this.props;
        const { contents } = payload;
        const { hover } = this.state;
        let listItems = this.buildListComponents(classes, contents, symbolTable, addViewerToCanvas);
        const contentWidth = listItems.length * (listItemWidth + listItemMargin * 2);
        const listOffset = this.rootElem ? Math.max(0, (this.rootElem.offsetWidth - contentWidth) / 2) : 0;
        return (
            <div className={classes.root} ref={rootElem => {this.rootElem = rootElem}}>
                <div className={classes.list} style={{marginLeft: listOffset}}>
                    {listItems}
                </div>
                <div className={classes.tooltip}>
                    <span className={classes.tooltipStr}>{hover ? hover : '-'}</span>
                </div>
            </div>
        );
    }
}

/** Connects application state objects to component props. */
function mapStateToProps(state, props) {
    return {
        symbolTable: state.program.symbolTable,  // TODO make a selector for only relevant portions of the symbol table
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        addViewerToCanvas:    addViewerActionThunk,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(ListViewer));
