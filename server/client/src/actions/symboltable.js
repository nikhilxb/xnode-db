import { REF } from '../services/mockdata.js';

/** Action type definitions. */
export const SymbolTableActions = {
    UPDATE_SYMBOL_TABLE:  "SYMBOLTABLE::UPDATE_SYMBOL_TABLE",
    FETCH_DATA_FAILED:  "SYMBOLTABLE::FETCH_DATA_FAILED",
    PARSE_DATA_FAILED: "SYMBOLTABLE::PARSE_DATA_FAILED",
};

function fetchSymbolData(symbolId) {
    return fetch(`/api/debug/load_symbol/${symbolId.replace(`${REF}`, '')}`);
};

function updateSymbolTableAction(symbolId, data, shells) {
    return {
        type: SymbolTableActions.UPDATE_SYMBOL_TABLE,
        symbolId,
        data,
        shells,
    };
}

function parseFailedAction(symbolId, resp, error) {
    return {
        type: SymbolTableActions.PARSE_DATA_FAILED,
        resp,
        error,
    };
}

function fetchFailedAction(symbolId, error) {
    return {
        type: SymbolTableActions.FETCH_DATA_FAILED,
        error,
    };
}

/** Action creator to __. */
// do we even need a thunk here? When can this be called when the data isn't loaded?
export function fetchSymbolDataAction(symbolId) {
    return fetchSymbolData(symbolId).then(
        resp => resp.json.then(
            ({ data, shells }) => dispatch(updateSymbolTable(symbolId, data, shells)),
            error => dispatch(parseFailedAction(symbolId, resp, error)),
        ),
        error => dispatch(fetchFailedAction(symbolId, error)),
    );
}
