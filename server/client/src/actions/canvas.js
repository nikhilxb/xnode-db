/** Action type definitions. */
export const CanvasActions = {
    ADD_VIEWER:    "CANVAS::ADD_VIEWER",
    REMOVE_VIEWER: "CANVAS::REMOVE_VIEWER",
};

/** Action creator to __. */
export function addViewerAction(symbolId) {
    return {
        type: CanvasActions.ADD_VIEWER,
        symbolId
    };
};

/** Action creator to remove a viewer from the data canvas. */
export function removeViewerAction(symbolId) {
    return {
        type: CanvasActions.REMOVE_VIEWER,
        symbolId
    };
};