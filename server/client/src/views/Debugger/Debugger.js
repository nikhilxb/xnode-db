import './Debugger.css';
import React, { Component } from 'react';

// Material UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { withStyles } from 'material-ui/styles';
import createMuiTheme from 'material-ui/styles/createMuiTheme'


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
                    <div className="Debugger-sidebar">
                        Hi
                    </div>
                    <div className="Debugger-canvas">
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withStyles(styles)(Debugger);