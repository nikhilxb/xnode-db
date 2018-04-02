import Immutable from 'seamless-immutable';
import { VarListActions } from '../actions/varlist';

import { REF } from '../services/mockdata.js';

/**
 * State slice structure for `program`: {
 *     topLevelItemIds: [..],
 *     varListItems: {},
 *     nextVarListItemId: 0,
 * }
 *
 * TODO: What kind of data is in each of these structures?
 */

/** Root reducer's initial state slice. */
const initialState = Immutable({
    topLevelItemIds: [],
    varListItems: {},
    nextVarListItemId: 0,
});

/** Root reducer for updating the state for varlist for the current paused program's namespace. */
export default function rootReducer(state = initialState, action) {
    const { type } = action;
    switch(type) {
        case VarListActions.RESET_VARLIST:                  return updateNamespaceReducer(state, action);
        case VarListActions.TOGGLE_VARLIST_ITEM_EXPANDED:   return toggleVarListItemExpandedReducer(state, action);
        case VarListActions.TOGGLE_VARLIST_ITEM_LOADING:    return toggleVarListItemLoadingReducer(state, action);
        case VarListActions.UPDATE_VARLIST_ITEM_CHILDREN:   return updateVarListItemChildrenReducer(state, action);
    }
    return state;  // No effect by default
};

function toggleVarListItemExpandedReducer(state, action) {
    const { itemId } = action;
    return state.setIn(['varListItems', itemId, 'expanded'], !state.varListItems[itemId].expanded);
}

function toggleVarListItemLoadingReducer(state, action) {
    const { itemId } = action;
    return state.setIn(['varListItems', itemId, 'loading'], !state.varListItems[itemId].loading);
}

function updateVarListItemChildrenReducer(state, action) {
    const { itemId, itemAttributes } = action;
    let newVarListItems = {};
    let children = [];
    let nextItemId = state.nextVarListItemId;
    Object.entries(itemAttributes).forEach(([key, value]) => {
        let symbolId = null;
        let payload = value;
        if (typeof value === 'string' && value.startsWith(`${REF}`)) {
            symbolId = value;
            payload = null;
        }
        newVarListItems[nextItemId] = {
            name: key,
            symbolId,
            payload,
            expanded: false,
            loading: false,
            children: null,
        };
        children.push(nextItemId);
        nextItemId += 1;
    });
    return state.merge({varListItems: newVarListItems}, {deep: true}).set('nextVarListItemId', nextItemId).setIn(['varListItems', itemId, 'children'], children);
}

function updateNamespaceReducer(state, action) {
    const { namespace } = action;

    let newVarListItems = {};
    let topLevelItemIds = [];
    let nextItemId = 0;
    Object.entries(namespace).forEach(([symbolId, shell]) => {
        newVarListItems[nextItemId] = {
            name: shell.name,
            symbolId,
            payload: null,
            expanded: false,
            loading: false,
            children: null,
        };
        topLevelItemIds.push(nextItemId);
        nextItemId += 1;
    });
    return Immutable({
        topLevelItemIds: topLevelItemIds,
        varListItems: newVarListItems,
        nextVarListItemId: nextItemId,
    });
}
