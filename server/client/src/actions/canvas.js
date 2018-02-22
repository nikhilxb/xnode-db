/** Action type definitions. */
export const CanvasActions = {
    ADD_VIEWER:    "CANVAS::ADD_VIEWER",
    REMOVE_VIEWER: "CANVAS::REMOVE_VIEWER",
};

/**
 * Action creator to add a viewer to the canvas for the symbol with the given `symbolId`. It is possible that there
 * exist other viewers 
 * @param symbolId Symbol to create new viewer for.
 * @returns {{type: string, symbolId: *}}
 */
export function addViewerAction(symbolId) {
    return {
        type: CanvasActions.ADD_VIEWER,
        symbolId
    };
};

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
};