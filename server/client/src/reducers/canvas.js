import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { CanvasActions } from '../actions/canvas';

/**
 * State slice structure for `canvas`: {
 *     'nextViewerId': 1,
 *     'viewerObjects': {
 *         0: {
 *             symbolId: "@id:12345"
 *             hasLoaded: false,
 *         }
 *     },
 *     'viewerPositions': [0],
 * }
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
        case CanvasActions.VIEWER_DONE_LOADING: return viewerDoneLoadingReducer(state, action);
        case CanvasActions.SET_VIEWER_GRAPH: return setViewerGraphReducer(state, action);
    }
    return state;  // No effect by default
};

/** Sets the `graph` field of a viewer to hold onto a laid-out graph. ELK uses promises to create the graph, so we
 * cannot just compute it in `render()` and display it. It needs to be stored in state.
 * @param state
 * @param action
 */
function setViewerGraphReducer(state, action) {
    const { graph, viewerId } = action;
    return state.setIn(['viewers', viewerId, 'graph'], graph)
}

/** Reducer for indicating that a viewer has finished loading. */
function viewerDoneLoadingReducer(state, action) {
    const { viewerId } = action;
    return state.setIn(['viewerObjects', viewerId, 'hasLoaded'], true);
}

/** Reducer for adding a viewer to `canvas`. Assumes `data` for symbol is already loaded.  */
function addViewerReducer(state, action) {
    const { symbolId } = action;
    const { nextViewerId } = state;
    return state.setIn(['viewerObjects', nextViewerId], {
        symbolId,
        hasLoaded: false,
    }).update('nextViewerId', (prev) => prev + 1)
        .update('viewerPositions', (prev) => prev.concat([state.nextViewerId]));
}

/** Reducer for removing a viewer from `canvas`. */
function removeViewerReducer(state, action) {
    const { viewerId } = action;
    let removeIdx = state.viewerPositions.indexOf(viewerId);
    if(removeIdx === -1) return state;
    return state.update('viewerPositions', (arr) => arr.slice(0, removeIdx).concat(arr.slice(removeIdx + 1)))
                .setIn(['viewerObjects', viewerId], undefined);
}