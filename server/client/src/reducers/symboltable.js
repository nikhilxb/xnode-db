import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { SymbolTableActions } from '../actions/symboltable';

/** Root reducer's initial state slice. */
const initialState = Immutable({});

/** TODO: Short description of root reducer for state slice. */
export default function rootReducer(state = initialState, action) {
    const { type } = action;
    switch(type) {
        case SymbolTableActions.UPDATE_SYMBOL_DATA: return updateSymbolDataReducer(state, action);
        case SymbolTableActions.UPDATE_NAMESPACE:   return updateNamespaceReducer(state, action);
        case SymbolTableActions.PARSE_DATA_FAILED:  return parseDebuggerResponseFailedReducer(state, action);
        case SymbolTableActions.FETCH_DATA_FAILED:  return fetchFromDebuggerFailedReducer(state, action);
    }
    return state;  // No effect by default
};

/** Some message sent by the Python program could not be parsed as JSON.  */
function parseDebuggerResponseFailedReducer(state, action) {
    let { duringAction, resp } = action;
    console.error('parseDataFailedReducer', duringAction, resp);
    return state;
}

/** The Python program did not return any information in response to some request. */
function fetchFromDebuggerFailedReducer(state, action) {
    let { duringAction } = action;
    console.error('fetchDataFailedReducer', duringAction, error);
    return state;
}

/** Given the newly-acquired data for a particular symbol and an object containing the shells referenced by it, add the
    new shells and fill in the symbol's data field. */
function updateSymbolDataReducer(state, action) {
    const { symbolId, data, shells } = action;
    return state.merge(shells).set(symbolId, "data", data);
    // return state.merge({shells, symbolId: {data: data}});
    // return Immutable({
    //     ...state,
    //     ...shells,
    //     symbolId: {
    //         ...state[symbolId],
    //         data: data,
    //     }
    // });
};

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
};


/** TODO: Reducer for asynchronous action. */
function asyncReducer(state, action) {
    return handle(state, action, {
        start:   state => ({...state}),  // of form `state ==> (state)`
        finish:  state => ({...state}),
        failure: state => ({...state}),
        success: state => ({...state}),
    });
};
