import React, { Component } from 'react';
import PropTypes            from 'prop-types';

import { withStyles }   from 'material-ui/styles';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import createMuiTheme   from 'material-ui/styles/createMuiTheme';
import grey             from 'material-ui/colors/grey';

import VarList          from './VarList';
import Canvas           from './Canvas';
import ControlBar       from './ControlBar';
import GraphViewer      from '../../components/DataViewer/GraphViewer/GraphViewer.js';
import GraphDataViewer  from '../../components/DataViewer/GraphViewer/GraphDataViewer.js';
import GraphOpViewer    from '../../components/DataViewer/GraphViewer/GraphOpViewer.js';

import {loadGlobals, loadSymbol, REF} from '../../services/mockdata.js';
import {bindActionCreators} from "redux/index";
import {connect} from "react-redux";


/** Custom theme object that affects visual properties (fonts, colors, spacing, etc.) of Material UI components.
 *  For in depth description and list of overridable keys: https://material-ui-next.com/customization/themes/ */
const theme = createMuiTheme({
});

/** Component styling object. */
const styles = theme => ({
    mainContainer: {
        display: 'flex',
        height: '100vh',
    },
    leftContainer: {
        maxWidth: '350px',
        width: '100%',
    },
    rightContainer: {
        backgroundColor: grey[100],
        textAlign: 'center',
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'column',
    }

});

/**
 * This smart component defines the main layout of the debugging view.
 */
class Debugger extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Constructor. Initializes state to include a symbolTable, which is mutated by passing a callback to VarList and
     * Canvas. TODO: Move state into a Redux store.
     */
    constructor(props) {
        super(props);
        this.getSymbolShell = this.getSymbolShell.bind(this);
        this.loadSymbolData = this.loadSymbolData.bind(this);
        this.loadSymbolDataAndCreateComponent = this.loadSymbolDataAndCreateComponent.bind(this);
        this.addViewerToCanvas = this.addViewerToCanvas.bind(this);
        this.changeProgramState = this.changeProgramState.bind(this);

        this.symbolTable = {};
        fetch('/api/debug/get_namespace')
        .then(resp => resp.json()
        .then(({context, namespace}) => {
            this.symbolTable = namespace;
            this.forceUpdate();
        }).catch((reason) => {
            // TODO handle errors here, like the program having ended.
        }));

        this.state = {
            viewers: [],
        }
    }

    /**
     * Creates a new DataViewer component, which will be rendered in the Canvas.
     * @param {string} symbolId
     */
    addViewerToCanvas(symbolId) {
        this.loadSymbolDataAndCreateComponent(symbolId, {isTopLevel: true}, (blah, bloh, newComponent) => {
            let viewers = this.state.viewers;
            viewers.push(newComponent);
            this.setState({
                viewers: viewers,
            });
        });
    }
    /**
     * Loads the data for a symbol, then creates a new component for it. Executes a callback afterwards. Used by
     * viewers to create other viewers (e.g., the GraphViewer creating GraphDataViewers).
     * @param  {String}   symbolId
     * @param  {Object}   extraProps Any extra props to be passed to the new component.
     * @param  {Function} callback
     */
    loadSymbolDataAndCreateComponent(symbolId, extraProps, callback) {
        this.loadSymbolData(symbolId, (shellAndData) => {
            const props = {
                ...shellAndData,
                ...extraProps,
                key: symbolId,
                symbolId: symbolId,
                loadComponent: this.loadSymbolDataAndCreateComponent,
            }
            let newComponent = null;
            if (shellAndData.type === "graphdata" && extraProps.isTopLevel) {
                newComponent = (<GraphViewer {...props} />);
            }
            else if (shellAndData.type === "graphdata") {
                newComponent = (<GraphDataViewer {...props} />);
            }
            else if (shellAndData.type === "graphop") {
                newComponent = (<GraphOpViewer {...props} />);
            }
            callback(symbolId, shellAndData, newComponent);
        });
    }

    /**
     * Send an API call to the server, which should change the program state. If the program hits another breakpoint,
     * an object with a program context string and a namespace shell dictionary is expected.
     * @param  {string} url API url to get.
     */
    changeProgramState(url) {
        this.setState({
            viewers: [],
        });
        this.symbolTable = {};
        this.forceUpdate();
        fetch(url)
        .then(resp => resp.json()
        .then(({context, namespace}) => {
            this.symbolTable = namespace;
            this.forceUpdate();
        }).catch((reason) => {
            // TODO handle end-of-program here
        }));
    }

    /**
     * Returns the schema shell for the specified symbol ID, which should already be in the `symbolTable`.
     * @param symbolId
     */
    getSymbolShell(symbolId) {
        let {type, name, str} = this.symbolTable[symbolId];  // Should not be null
        return {type: type, name: name, str: str};
    }

    /**
     * Loads the symbol data with the specified symbol ID, as well as any referenced shells. These new schemas are
     * added to the symbol table only if not already present. When the data is finished loading, add it to the symbol
     * table and execute the given callback, sending that data to the component (likely a DataViewer) that requested it.
     * @param symbolId
     * @param callback
     */
    loadSymbolData(symbolId, callback) {
        // Symbol has already been fully loaded
        if(this.symbolTable[symbolId] && this.symbolTable[symbolId].data !== null) {
            callback(this.symbolTable[symbolId]);
        } else {
            if (!this.symbolTable[symbolId]) {
                console.error('Symbol ' + symbolId + ' was requested before shell was loaded');
            } else {
                console.log('Sending load request');
                fetch(`/api/debug/load_symbol/${symbolId.replace(`${REF}`, '')}`)
                .then((response)=>
                    response.json()
                .then(({data: newData, shells: newShells}) => {
                    for(const shellId of Object.keys(newShells)) {
                        if (!this.symbolTable[shellId]) {
                            this.symbolTable[shellId] = newShells[shellId];
                        }
                    }
                    this.symbolTable[symbolId].data = newData;
                    callback(this.symbolTable[symbolId]);
                }));
            }
        }
    }

    /**
     * Renders the debugger as a two-column layout. The left column displays the variable list; the right column
     * displays the control buttons (step, continue, etc.) and canvas where viewers are displayed.
     * TODO: Don't pass whole symbol table, bc what about nested?
     */
    render() {
        const {classes} = this.props;

        return (
            <MuiThemeProvider theme={theme}>
                <div className={classes.mainContainer}>
                    <div className={classes.leftContainer}>
                        <VarList
                            symbolIds={Object.keys(this.symbolTable)}
                            getSymbolShell={this.getSymbolShell}
                            addViewerToCanvas={this.addViewerToCanvas}
                        />
                    </div>
                    <div className={classes.rightContainer}>
                        <ControlBar changeProgramState={this.changeProgramState}/>
                        <Canvas
                            viewers={this.state.viewers}
                        />
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

// Inject styles and data into component
function mapStateToProps(state) {
    return {
        // propName: state.subslice,
    };
}
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        // propName: doSomethingAction,
    }, dispatch);
}
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Example));
