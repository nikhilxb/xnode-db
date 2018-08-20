import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { SymbolTableActions } from '../actions/program';

/**
 * State slice structure for `program`: {
 *     symbolTable: {
 *         "@id:12345" : {
 *             type: "number",
 *             name: "myInt",
 *             str:  "86",
 *             data: null/{viewer:{}, attributes{}}
 *         }
 *     }
 *     stackFrame: [{
 *         fileName: "c:\\...",
 *         lineNo: 37,
 *         functionName: "myFn"
 *         args: "(arg1, arg2)",
 *         returningTo: "myFn2" or null,
 *         line: "return 10",
 *     }, ...] or null,
 *     state: "waiting" or "running" or "disconnected",
 * }
 */

/** Root reducer's initial state slice. */
const initialState = Immutable({
    symbolTable: {},
    context: null,
    programState: 'disconnected',
});

/** Root reducer for state related to the paused program's state and symbols that have been loaded. */
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
    return Immutable.merge({symbolTable: shells}, state, {deep: true}).setIn(['symbolTable', symbolId, 'data'], data);
}

/** Given a new namespace dict, reset the entire symbol table to only contain that namespace.
    TODO be smarter with updating; don't wipe data that you don't need to */
function updateNamespaceReducer(state, action) {
    const { programState, stackFrame, namespace } = action;
    return Immutable({
        symbolTable: namespace,
        stackFrame,
        programState,
    });
}
