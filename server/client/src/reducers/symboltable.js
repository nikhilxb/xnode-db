import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { SymbolTableActions } from '../actions/symboltable';

/** Root reducer's initial state slice. */
const initialState = Immutable({});

/** TODO: Short description of root reducer for state slice. */
export default function rootReducer(state = initialState, action) {
    const { type } = action;
    switch(type) {
        case SymbolTableActions.UPDATE_SYMBOL_TABLE:
            return updateSymbolTableReducer(state, action);
        case SymbolTableActions.PARSE_DATA_FAILED:
            return parseDataFailedReducer(state, action);
        case SymbolTableActions.FETCH_DATA_FAILED:
            return fetchDataFailedReducer(state, action);
        case SymbolTableActions.SYNC_ACTION:
            return syncReducer(state, action);
        case SymbolTableActions.ASYNC_ACTION:
            return asyncReducer(state, action);
    }
    return state;  // No effect by default
};

/** TODO: Reducer for synchronous action. */
function syncReducer(state, action) {
    return state;
};

/** The data object returned by the Python program was not parseable as JSON. */
function parseDataFailedReducer(state, action) {
    let { symbolId, resp } = action;
    console.error('parseDataFailedReducer', symbolId, resp);
    return state;
}

/** The Python program did not return any information about the requested symbol. */
function fetchDataFailedReducer(state, action) {
    let { symbolId } = action;
    console.error('fetchDataFailedReducer', symbolId);
    return state;
}

/** Given the newly-acquired data for a particular symbol and an object containing the shells referenced by it, add the
    new shells and fill in the symbol's data field. */
function updateSymbolTableReducer(state, action) {
    const { symbolId, data, shells } = action;
    return {
        ...state,
        ...shells,
        symbolId: {
            ...state[symbolId],
            data: data,
        }
    };
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
