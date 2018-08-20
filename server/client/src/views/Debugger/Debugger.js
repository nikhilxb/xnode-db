import React, { Component }   from 'react';
import PropTypes              from 'prop-types';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import { withStyles }       from 'material-ui/styles';
import MuiThemeProvider     from 'material-ui/styles/MuiThemeProvider';
import createMuiTheme       from 'material-ui/styles/createMuiTheme';
import ColorGrey            from 'material-ui/colors/grey';
import Divider              from 'material-ui/Divider';

import '../../../node_modules/react-vis/dist/style.css';  // required for `react-vis` (data visualization library)

import VarList              from './VarList';
import Canvas               from './Canvas';
import ProgramStatePanel    from './DebugStatePanel';


/**
 * This smart component defines the main layout of the debugging view.
 */
class Debugger extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /**
     * Renders the debugger as a two-column layout. The left column displays the variable list, the control buttons,
     * and the debugged program's execution state . The right column displays the canvas used for inspecting data
     * structures visually.
     */
    render() {
        const { classes } = this.props;

        return (
            <MuiThemeProvider theme={theme}>
                <div className={classes.mainContainer}>
                    <div className={classes.leftContainer}>
                        <div className={classes.debugStateContainer}>
                            <ProgramStatePanel/>
                            <Divider/>
                        </div>
                        <div className={classes.varListContainer}>
                            <VarList/>
                        </div>
                    </div>
                    <div className={classes.rightContainer}>
                        <Canvas />
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}


// To inject styles into component
// -------------------------------

/** CSS-in-JS custom theme object that affects visual properties (fonts, colors, spacing, etc.) of Material UI
 *  components. For in depth description and list of overridable keys: <material-ui-next.com/customization/themes/> */
const theme = createMuiTheme({
    spacing: {
        unit: 5,
    },
    typography: {
        htmlFontSize: 10,
        monospace: {
            fontFamily: '"Roboto Mono", "Courier", monospace',
        }
    },
});

/** CSS-in-JS styling object. */
const styles = theme => ({
    mainContainer: {
        display: 'flex',
        height: '100vh',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSize,
        fontWeight: theme.typography.fontWeightRegular,
    },
    leftContainer: {
        maxWidth: '350px',
        width: '100%',
        height: '100%',

        display: 'flex',
        flexDirection: 'column',
    },
    rightContainer: {
        backgroundColor: ColorGrey[100],
        textAlign: 'center',
        flexGrow: 1,

        display: 'flex',
        flexDirection: 'column',
    },
    debugStateContainer: {
        flex: 'none',
    },
    varListContainer: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
    }
});


// To inject application state into component
// ------------------------------------------

/** Connects application state objects to component props. */
function mapStateToProps(state) {
    return {
        // propName: state.subslice,
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        // propName: doSomethingAction,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Debugger));
