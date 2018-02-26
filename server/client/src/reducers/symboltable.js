import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { SymbolTableActions } from '../actions/symboltable';

/**
 * State slice structure for `symboltable`: {
 *     "@id:12345" : {
 *         type: "number",
 *         name: "myInt",
 *         str:  "86",
 *         data: null/{viewer:{}, attributes{}}
 *     }
 * }
 */

/** Root reducer's initial state slice. */
const initialState = Immutable({});

/** TODO: Short description of root reducer for state slice. */
export default function rootReducer(state = initialState, action) {
    const { type } = action;
    switch(type) {
        case SymbolTableActions.ENSURE_SYMBOL_DATA_LOADED: return ensureSymbolDataLoadedReducer(state, action);
        case SymbolTableActions.UPDATE_NAMESPACE:   return updateNamespaceReducer(state, action);
    }
    return state;  // No effect by default
};

/** Given the newly-acquired data for a particular symbol and an object containing the shells referenced by it, add the
    new shells and fill in the symbol's data field. */
function ensureSymbolDataLoadedReducer(state, action) {
    const { symbolId, data, shells } = action;
    // It's important that `shells` be the first argument, so existing symbols are not overwritten
    return Immutable.merge(shells, state, {deep: true}).setIn([symbolId, "data"], data);
}

/** Given a new namespace dict, reset the entire symbol table to only contain that namespace.
    TODO be smarter with updating; don't wipe data that you don't need to */
function updateNamespaceReducer(state, action) {
    const { context, namespace } = action;
    // TODO: figure out where context string goes
    return Immutable(namespace);
}

/** TODO: Reducer for synchronous action. */
function syncReducer(state, action) {
    return state;
}

/** TODO: Reducer for asynchronous action. */
function asyncReducer(state, action) {
    return handle(state, action, {
        start:   state => ({...state}),  // of form `state ==> (state)`
        finish:  state => ({...state}),
        failure: state => ({...state}),
        success: state => ({...state}),
    });
}
