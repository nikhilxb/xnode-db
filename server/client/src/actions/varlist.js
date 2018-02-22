import { ensureSymbolDataLoaded } from './symboltable.js';

/** Action type definitions. */
export const VarListActions = {
    RESET_VARLIST:                 "VARLIST::RESET_VARLIST",
    TOGGLE_VARLIST_ITEM_EXPANDED:  "VARLIST::TOGGLE_VARLIST_ITEM_EXPANDED",
    TOGGLE_VARLIST_ITEM_LOADING:   "VARLIST::TOGGLE_VARLIST_ITEM_LOADING",
    UPDATE_VARLIST_ITEM_CHILDREN:  "VARLIST::UPDATE_VARLIST_ITEM_CHILDREN",
};


function toggleVarListItemExpandedAction(itemId) {
    return {
        type: VarListActions.TOGGLE_VARLIST_ITEM_EXPANDED,
        itemId,
    }
}

function toggleVarListItemLoadingAction(itemId) {
    return {
        type: VarListActions.TOGGLE_VARLIST_ITEM_LOADING,
        itemId,
    }
}

function updateVarListItemChildrenAction(itemId, itemAttributes) {
    return {
        type: VarListActions.UPDATE_VARLIST_ITEM_CHILDREN,
        itemId,
        itemAttributes,
    }
}

export function resetVarListAction(namespace) {
    return {
        type: VarListActions.RESET_VARLIST,
        namespace,
    }
}

function ensureVarListItemChildrenLoaded(itemId) {
    return (dispatch, getState) => {
        if (getState().varlist.varListItems[itemId].children) {
            // You don’t have to return Promises, but it’s a handy convention
            // so the caller can always call .then() on async dispatch result.
            return Promise.resolve();
        }
        let symbolId = getState().varlist.varListItems[itemId].symbolId;
        let itemAttributes = getState().symboltable[symbolId].data.attributes;
        return Promise.resolve().then(() => dispatch(updateVarListItemChildrenAction(itemId, itemAttributes)));
    }
}

export function resetVarList(namespace) {
    return (dispatch) => {
        return dispatch(resetVarListAction(namespace));
    }
}

export function toggleVarListItemExpanded(itemId) {
    return (dispatch, getState) => {
        if (getState().varlist.varListItems[itemId].expanded) {
            return Promise.resolve().then(dispatch(toggleVarListItemExpandedAction(itemId)));
        }
        else {
            let symbolId = getState().varlist.varListItems[itemId].symbolId;
            return Promise.all([
                dispatch(ensureSymbolDataLoaded(symbolId)),
                dispatch(toggleVarListItemLoadingAction(itemId)),
            ]).then(
                () => dispatch(ensureVarListItemChildrenLoaded(itemId)).then(
                    () => {
                        dispatch(toggleVarListItemExpandedAction(itemId));
                        dispatch(toggleVarListItemLoadingAction(itemId));
                    },
                )
            );
        }
    };
}
