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
            return updateSymbolTable(state, action);
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

function updateSymbolTable(state, action) {
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
