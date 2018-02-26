import { ensureSymbolDataLoadedActionThunk } from "./symboltable";

/** Action type definitions. */
export const CanvasActions = {
    ADD_VIEWER:          "CANVAS::ADD_VIEWER",
    REMOVE_VIEWER:       "CANVAS::REMOVE_VIEWER",
    VIEWER_DONE_LOADING: "CANVAS::VIEWER_DONE_LOADING",
    SET_VIEWER_GRAPH: "CANVAS::SET_VIEWER_GRAPH",
};

/**
 * Action creator thunk to add a viewer to the canvas for the symbol with the given `symbolId`. It is possible to have
 * multiple viewers with the same `symbolId` -- each will have a viewer with linked properties to the others.
 * @param symbolId Symbol to create new viewer for.
 * @returns {{type: string, symbolId: *}}
 */
function addViewerAction(symbolId) {
    return {
        type: CanvasActions.ADD_VIEWER,
        symbolId
    };
}
export function addViewerActionThunk(symbolId) {
    return (dispatch) => {
        return dispatch(ensureSymbolDataLoadedActionThunk(symbolId)).then(
            () => dispatch(addViewerAction(symbolId))
        );
    }
}

/**
 * Action creator to set a viewer's `hasLoaded` property to `true`. The behavior induced by this change, as well as when
 * (if ever) this property is used, is determined by the viewer itself. Currently used only by `GraphViewer` to indicate
 * that all components have been loaded.
 * @param viewerId
 * @returns {{type: string, viewerId: *}}
 */
export function setViewerDoneLoadingAction(viewerId) {
    return {
        type: CanvasActions.VIEWER_DONE_LOADING,  // TODO: What is this?
        viewerId,
    }
}

/**
 * Action creator to remove a viewer from the data canvas.
 * @param viewerId (int)
 * @returns {{type: string, viewerId: *}}
 */
export function removeViewerAction(viewerId) {
    return {
        type: CanvasActions.REMOVE_VIEWER,
        viewerId
    };
}

//TODO: combine setViewerGraphAction and setViewerDoneLoading into one setViewerState(key, value) function? These
// functions are only used by GraphViewer, and both just set some key in the viewer object to a value, so they could
// be generalized. However, this would mean that the actions would need some knowledge of what the state should look
// like.
export function setViewerGraphAction(viewerId, graph) {
    return {
        type: CanvasActions.SET_VIEWER_GRAPH,
        viewerId,
        graph,
    }
}