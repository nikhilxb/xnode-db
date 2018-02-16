import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { withStyles } from 'material-ui/styles';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import createMuiTheme from 'material-ui/styles/createMuiTheme';
import grey from 'material-ui/colors/grey';

import VarList from './VarList';
import Canvas from './Canvas';
import ControlBar from './ControlBar';
import DataViewer from '../../components/DataViewer/DataViewer.js';

import {loadGlobals, loadSymbol, REF} from './services/mockdata.js';


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

console.log(loadGlobals());
console.log(loadSymbol(`${REF}006`));
console.log(loadSymbol(`${REF}106`));
console.log(loadSymbol(`${REF}206`));

/**
 * This component defines the main layout of the debugging view.
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
        this.addViewerToCanvas = this.addViewerToCanvas.bind(this);

        this.symbolTable = {};
        fetch('/api/debug/get_namespace')
        .then(resp => resp.json()
        .then(({context, namespace}) => {
            this.symbolTable = namespace;
            this.forceUpdate();
        }));

        this.state = {
            viewers: [],
        }
    }

    addViewerToCanvas(symbolId) {
        let viewers = this.state.viewers;
        viewers.push(<DataViewer key={symbolId} symbolId={symbolId} loadSymbol={this.loadSymbolData} isTopLevel={true} />);

        this.setState({
            viewers: viewers,
        });
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
     * Loads the symbol data with the specified symbol ID, as well as any referenced shells. These new schemas replace
     * any existing ones in the `symbolTable` for the same symbols. When the data is finished loading, execute the
     * given callback, sending that data to the component (likely a DataViewer) that requested it.
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
                    let keptShells = {};
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
                        <ControlBar/>
                        <Canvas
                            viewers={this.state.viewers}
                        />
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withStyles(styles)(Debugger);
