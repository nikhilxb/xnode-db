import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withStyles } from 'material-ui/styles';


/** Component styling object. */
const styles = theme => ({
    // css-key: value,
});

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
        const {classes} = this.props;

        return (
            null
        );
    }
}

// TODO: For dumb components, just use following and delete `connect`/`bindActionCreators` imports.
// // Inject styles into component
// export default withStyles(styles)(Example);

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
