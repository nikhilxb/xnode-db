import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { CanvasActions } from '../actions/canvas';

/**
 * State slice structure for `canvas`: {
 *     'nextViewerId': 1,
 *     'viewerObjects': {
 *         '0': {
 *             symbolId: "@id:12345"
 *             payload: {},
 *         }
 *     },
 *     'viewerPositions': [{
 *         i, x, y, w, h, ...
 *     }],
 * }
 *
 * Note: The key for `viewerObjects` are numbers but `viewerPositions[*].i` is a string.
 */

/** Root reducer's initial state slice. */
const initialState = Immutable({
    nextViewerId: 0,
    viewerObjects: {},
    viewerPositions: [],
});

/** Root reducer for updating the canvas view state. */
export default function rootReducer(state = initialState, action) {
    const { type } = action;
    switch(type) {
        case CanvasActions.ADD_VIEWER:          return addViewerReducer(state, action);
        case CanvasActions.REMOVE_VIEWER:       return removeViewerReducer(state, action);
        case CanvasActions.UPDATE_LAYOUT:       return updateLayoutReducer(state, action);
        case CanvasActions.SET_IN_PAYLOAD:      return setInViewerPayloadReducer(state, action);
    }
    return state;  // No effect by default
};

/* Constants for default React Grid Layout element sizes. */
const DEFAULT_W = 4;
const DEFAULT_H = 6;
const DEFAULT_MIN_W = 2;
const DEFAULT_MIN_H = 2;

/** Reducer for adding a viewer to `canvas`. Assumes `data` for symbol is already loaded.  */
function addViewerReducer(state, action) {
    const { symbolId } = action;
    const { nextViewerId } = state;
    return state.setIn(['viewerObjects', nextViewerId], {
        symbolId,
        payload: {},
    }).update('nextViewerId', (prev) => prev + 1)
        .update('viewerPositions', (prev) => prev.concat([{
            i: `${state.nextViewerId}`,
            x: 0,
            y: Infinity,
            w: DEFAULT_W,
            h: DEFAULT_H,
            minW: DEFAULT_MIN_W,
            minH: DEFAULT_MIN_H,
        }]));
}

/** Reducer for removing a viewer from `canvas`. */
function removeViewerReducer(state, action) {
    const { viewerId } = action;
    let removeIdx = state.viewerPositions.findIndex(elem => elem.i === `${viewerId}`);
    if(removeIdx === -1) return state;
    return state.update('viewerPositions', (arr) => arr.slice(0, removeIdx).concat(arr.slice(removeIdx + 1)))
                .setIn(['viewerObjects', viewerId], undefined);
}

/** Reducer for updating the `viewerPositions` in `canvas`. */
function updateLayoutReducer(state, action) {
    const { layout } = action;
    return state.set('viewerPositions', layout);
}

/** Reducer for adding a key-value pair to an object's payload object. */
function setInViewerPayloadReducer(state, action) {
    const { keyArray, value, viewerId } = action;
    return state.setIn(['viewerObjects', viewerId, 'payload'].concat(keyArray), value);
}