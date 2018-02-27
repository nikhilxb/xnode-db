import { ensureSymbolDataLoadedActionThunk } from "./symboltable";

/** Action type definitions. */
export const CanvasActions = {
    ADD_VIEWER:          "CANVAS::ADD_VIEWER",
    REMOVE_VIEWER:       "CANVAS::REMOVE_VIEWER",
    ADD_PAYLOAD_ITEM:    "CANVAS::ADD_PAYLOAD_ITEM",
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
 * Action creator to associate `key` with `value` in the viewer's payload object.
 */
export function addViewerPayloadItemAction(viewerId, key, value) {
    return {
        type: CanvasActions.ADD_PAYLOAD_ITEM,
        viewerId,
        key,
        value,
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