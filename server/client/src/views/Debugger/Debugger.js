import React, { Component } from 'react';

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { withStyles } from 'material-ui/styles';
import createMuiTheme from 'material-ui/styles/createMuiTheme'

import VarList from './VarList';
import Canvas from './Canvas'


/** Custom theme object that affects visual properties (fonts, colors, spacing, etc.) of Material UI components.
 *  For in depth description and list of overridable keys: https://material-ui-next.com/customization/themes/ */
const theme = createMuiTheme({

});

const styles = {
    container: {
        display: "flex",
    }
};

/**
 * This class ___.
 */
class Debugger extends Component {

    /**
     * Renders ___.
     */
    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <div className={this.props.classes.container}>
                    <VarList/>
                    <Canvas/>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withStyles(styles)(Debugger);