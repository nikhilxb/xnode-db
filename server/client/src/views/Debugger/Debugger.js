import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from 'material-ui/styles';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import createMuiTheme from 'material-ui/styles/createMuiTheme'

import VarList from './VarList';
import Canvas from './Canvas';
import ControlBar from './ControlBar';
import {loadGlobals, loadSymbol, REF} from './services/mockdata.js';


/** Custom theme object that affects visual properties (fonts, colors, spacing, etc.) of Material UI components.
 *  For in depth description and list of overridable keys: https://material-ui-next.com/customization/themes/ */
const theme = createMuiTheme({
});


/** Component styling object. */
const styles = theme => ({
    mainContainer: {
        display: "flex",
    },
    leftContainer: {
        maxWidth: '350px',
        width: '100%',
    },
    rightContainer: {
        backgroundColor: 'rgb(248, 248, 248)',
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
 * This class ___.
 */
class Debugger extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Constructor. Initializes state to include a symbolTable, which is mutated by passing a callback to VarList and
     * Canvas. TODO: Move state into a Redux store.
     * @param props
     */
    constructor(props) {
        super(props);
        this.state = {
            symbolTable: loadGlobals(),
        };
        this.loadSymbol = this.loadSymbol.bind(this);
    }

    /**
     * Loads the symbol data with the specified symbol ID, as well as any referenced shells. These new schemas replace
     * any existing ones in the `symbolTable` for the same symbols. When the data is finished loading, execute the
     * given callback, sending that data to the component (likely a DataViewer) that requested it.
     */
    loadSymbol(symbolID, callback) {
        new Promise((resolve, reject) => {
            // Symbol has already been fully loaded
            if(this.state.symbolTable[symbolID] && this.state.symbolTable[symbolID].data === null) {
                resolve(this.state.symbolTable[symbolID]);
            }

            // TODO: Load symbol
        }).then(callback);
    }

    /**
     * Renders the debugger as a two-column layout. The left column displays the variable list; the right column
     * displays the control buttons (step, continue, etc.) and canvas where viewers are displayed.
     */
    render() {
        const {classes} = this.props;

        return (
            <MuiThemeProvider theme={theme}>
                <div className={classes.mainContainer}>
                    <div className={classes.leftContainer}>
                        <VarList/>
                    </div>
                    <div className={classes.rightContainer}>
                        <ControlBar/>
                        <Canvas loadSymbol={(symbolId, callback) => this.loadSymbol(symbolId, callback)}/>
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withStyles(styles)(Debugger);
