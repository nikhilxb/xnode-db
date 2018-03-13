import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from 'material-ui/styles';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createSelector } from "reselect";


/**
 * This [dumb/smart] component ___.
 */
class Example extends Component {

    /** Prop expected types object. */
    static propTypes = {
        classes: PropTypes.object.isRequired,
    };

    /** Constructor. */
    constructor(props) {
        super(props);
    }

    /**
     * Renders ___.
     */
    render() {
        const { classes } = this.props;
        return (
            <div className={classNames({
                [classes.container]: true,
            })}>
            </div>
        );
    }
}

// To inject styles into component
// -------------------------------

/** CSS-in-JS styling object. */
const styles = theme => ({
    // css-key: value,
});

// TODO: For dumb components, just use following and delete `connect`/`bindActionCreators`/`createSelector` imports.
// export default withStyles(styles)(Example);

// To inject application state into component
// ------------------------------------------

/** Connects application state objects to component props. */
function mapStateToProps(state, props) {  // Second argument `props` is manually set prop
    return (state, props) => {
        // propName1: state.subslice,
        // propName2: doSomethingSelector(state)
    };
}

/** Connects bound action creator functions to component props. */
function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        // propName: doSomethingAction,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(Example));
