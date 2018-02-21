import { REF } from '../services/mockdata.js';

/** Action type definitions. */
export const SymbolTableActions = {
    UPDATE_SYMBOL_DATA:  "SYMBOLTABLE::UPDATE_SYMBOL_DATA",
    UPDATE_NAMESPACE:    "SYMBOLTABLE::UPDATE_NAMESPACE",
    FETCH_DATA_FAILED:   "SYMBOLTABLE::FETCH_DATA_FAILED",
    PARSE_DATA_FAILED:   "SYMBOLTABLE::PARSE_DATA_FAILED",
};

/** Action which updates a symbol's data with a newly-fetched object and adds shells referenced therein to the symbol 
    table. */
function updateDataAction(symbolId, data, shells) {
    return {
        type: SymbolTableActions.UPDATE_SYMBOL_DATA,
        symbolId,
        data,
        shells,
    };
}

/** Action which resets the symbol table to contain a new namespace. */
function updateNamespaceAction(context, namespace) {
    return {
        type: SymbolTableActions.UPDATE_NAMESPACE,
        context,
        namespace,
    };
}

/** Action executed when the repsonse from the debugger could not be parsed as JSON. */
function parseFailedAction(duringAction, resp, error) {
    return {
        type: SymbolTableActions.PARSE_DATA_FAILED,
        duringAction,
        resp,
        error,
    };
}

/** Action executed when a fetch from the debugger failed. */
function fetchFailedAction(duringAction, error) {
    return {
        type: SymbolTableActions.FETCH_DATA_FAILED,
        duringAction,
        error,
    };
}

function fetchSymbolData(symbolId) {
    return fetch(`/api/debug/load_symbol/${symbolId.replace(`${REF}`, '')}`);
};

/** Action creator to fetch the data about a symbol and add it to the symbol table; only executes if the symbol data
    has not already been loaded. */
export function fetchSymbolDataAction(symbolId) {
    return (dispatch, getState) => {
        const dataInCache = getState().symbolTable[symbolId].data;
        if (dataInCache !== null) {
            return;
        }
        fetchSymbolData(symbolId).then(
            resp => resp.json.then(
                ({ data, shells }) => dispatch(updateDataAction(symbolId, data, shells)),
                error => dispatch(parseFailedAction(`fetchSymbolDataAction(${symbolId})`, resp, error)),
            ),
            error => dispatch(fetchFailedAction(`fetchSymbolDataAction(${symbolId})`, error)),
        );
    }
}

/** Action creator to fetch the data about a symbol and add it to the symbol table. */
export function fetchNamespaceAction() {
    return (dispatch) => {
        fetchNamespace().then(
            resp => resp.json.then(
                ({ context, namespace }) => dispatch(updateNamespaceAction(context, namespace)),
                error => dispatch(parseFailedAction('fetchNamespaceAction()', resp, error)),
            ),
            error => dispatch(fetchFailedAction('fetchNamespaceAction()', error)),
        );
    }
}
