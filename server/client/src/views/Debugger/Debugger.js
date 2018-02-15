import './Debugger.css';
import React, { Component } from 'react';

// Material UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { withStyles } from 'material-ui/styles';
import createMuiTheme from 'material-ui/styles/createMuiTheme';
import Canvas from './Canvas/Canvas.js';


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
    constructor(props, context) {
        super(props, context);
        this.state = {
            symbols: {
                "0": {
                    type: "graphdata",
                    str: "GraphData",
                    name: null,
                    data: {
                        viewer: {
                            creatorop: "1",
                        }
                    }
                },
                "1": {
                    type: "graphop",
                    str: "GraphOp",
                    name: null,
                    data: {
                        viewer: {
                            args: [null, "2"],
                            kwargs: {
                                "kwarg1": "3"
                            }
                        }
                    },
                },
                "2": {
                    type: "graphdata",
                    str: "GraphData",
                    name: null,
                    data: {
                        viewer: {
                            creatorop: null,
                        }
                    },
                },
                "3": {
                    type: "graphdata",
                    str: "GraphData",
                    name: "Named GraphData",
                    data: {
                        viewer: {
                            creatorop: null,
                        }
                    },
                }
            }
        }
    }

    getSymbolShellAndData(symbolId, callback) {
        new Promise((resolve, reject) => {
            setTimeout(() => resolve(this.state.symbols[symbolId]), 1000);
        }).then(callback);
    }
    /**
     * Renders ___.
     */
    render() {
        return (
            <MuiThemeProvider theme={theme}>
                <div className={this.props.classes.container}>
                    <div className="Debugger-sidebar">
                        <Canvas fetchShellAndData={(symbolId, callback) => this.getSymbolShellAndData(symbolId, callback)}/>
                    </div>
                    <div className="Debugger-canvas">
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withStyles(styles)(Debugger);
