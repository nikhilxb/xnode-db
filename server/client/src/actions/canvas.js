import { ensureSymbolDataLoadedActionThunk } from "./program";

/** Action type definitions. */
export const CanvasActions = {
    ADD_VIEWER:          "CANVAS::ADD_VIEWER",
    REMOVE_VIEWER:       "CANVAS::REMOVE_VIEWER",
    UPDATE_LAYOUT:       "CANVAS::UPDATE_LAYOUT",
    SET_IN_PAYLOAD:      "CANVAS::SET_IN_PAYLOAD",
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

/**
 * Action created to update the layout of the canvas.
 * @param layout
 * @returns {{type: string, layout: *}}
 */
export function updateLayoutAction(layout) {
    return {
        type: CanvasActions.UPDATE_LAYOUT,
        layout
    };
}

/**
 * Action creator to setIn `value` at the location of `keyArray` in the viewer's payload object.
 */
export function setInViewerPayloadAction(viewerId, keyArray, value) {
    return {
        type: CanvasActions.SET_IN_PAYLOAD,
        viewerId,
        keyArray,
        value,
    }
}