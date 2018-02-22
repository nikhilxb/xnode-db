import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { CanvasActions } from '../actions/canvas';

/** Root reducer's initial state slice = `canvas: []` */
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

/** Reducer for adding a viewer to `canvas`. Assumes that `data` for `symbolId` symbol is filled.  */
function addViewerReducer(state, action) {
    const { symbolId } = action;
    return state.concat([{
        symbolId: symbolId,

    }]);
};

/** Reducer for removing a viewer from `canvas`. */
function removeViewerReducer(state, action) {
    const { symbolId } = action;
    return state;
};