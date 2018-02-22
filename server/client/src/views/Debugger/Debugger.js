import React, { Component }   from 'react';
import PropTypes              from 'prop-types';
import { connect }            from 'react-redux';
import { bindActionCreators } from 'redux';

import { withStyles }   from 'material-ui/styles';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import createMuiTheme   from 'material-ui/styles/createMuiTheme';
import grey             from 'material-ui/colors/grey';

import VarList          from './VarList';
import Canvas           from './Canvas';
import ControlBar       from './ControlBar';
import GraphViewer      from '../../components/viewers/GraphViewer/GraphViewer.js';
import GraphDataViewer  from '../../components/viewers/GraphViewer/GraphDataViewer.js';
import GraphOpViewer    from '../../components/viewers/GraphViewer/GraphOpViewer.js';

import {loadGlobals, loadSymbol, REF} from '../../services/mockdata.js';




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
     * Renders the debugger as a two-column layout. The left column displays the variable list; the right column
     * displays the control buttons (step, continue, etc.) and canvas where viewers are displayed.
     */
    render() {
        const {classes} = this.props;

        return (
            <MuiThemeProvider theme={theme}>
                <div className={classes.mainContainer}>
                    <div className={classes.leftContainer}>
                        <VarList />
                    </div>
                    <div className={classes.rightContainer}>
                        <ControlBar />
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
export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Debugger));
