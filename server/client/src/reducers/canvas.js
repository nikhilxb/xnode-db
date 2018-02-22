import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { CanvasActions } from '../actions/canvas';

/**
 * State slice structure for `canvas`: {
 *     'nextViewerId': 1,
 *     'viewers': {[
 *         {
 *             symbolId: "@id:12345"
 *             viewerId: 0,
 *         }
 *     ]
 * }
 */

/** Root reducer's initial state slice. */
const initialState = Immutable([]);

/** Root reducer for updating the canvas view state. */
export default function rootReducer(state = initialState, action) {
    const { type } = action;
    switch(type) {
        case CanvasActions.ADD_VIEWER:    return addViewerReducer(state, action);
        case CanvasActions.REMOVE_VIEWER: return removeViewerReducer(state, action);
    }
    return state;  // No effect by default
};

/** Reducer for adding a viewer to `canvas`. Assumes `data` for symbol is already loaded.  */
function addViewerReducer(state, action) {
    const { symbolId } = action;
    return state.concat([{
        symbolId: symbolId,
    }]);
};

/** Reducer for removing a viewer from `canvas`. */
function removeViewerReducer(state, action) {
    const { viewerId } = action;
    return state.slice(viewerId).concat(state.slice(viewerId+1));
};