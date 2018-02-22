import { REF } from '../services/mockdata.js';

import { resetVarListAction } from './varlist.js';

/** Action type definitions. */
export const SymbolTableActions = {
    ENSURE_SYMBOL_DATA_LOADED:  "SYMBOLTABLE::ENSURE_SYMBOL_DATA_LOADED",
    UPDATE_NAMESPACE:    "SYMBOLTABLE::UPDATE_NAMESPACE",
};

/** Action which updates a symbol's data with a newly-fetched object and adds shells referenced therein to the symbol
    table. */
function ensureSymbolDataLoadedAction(symbolId, data, shells) {
    return {
        type: SymbolTableActions.ENSURE_SYMBOL_DATA_LOADED,
        symbolId,
        data,
        shells,
    };
}

function fetchSymbolData(symbolId) {
    return fetch(`/api/debug/load_symbol/${symbolId.replace(`${REF}`, '')}`);
};

function fetchNamespace() {
    return fetch('/api/debug/get_namespace');
};

/** Action which resets the symbol table to contain a new namespace. */
export function updateNamespaceAction(context, namespace) {
    return {
        type: SymbolTableActions.UPDATE_NAMESPACE,
        context,
        namespace,
    };
}

/** Action creator to fetch the data about a symbol and add it to the symbol table; only executes if the symbol data
    has not already been loaded. */
export function ensureSymbolDataLoaded(symbolId) {
    return (dispatch, getState) => {
        const dataInCache = getState().symboltable[symbolId].data;
        if (dataInCache !== null) {
            // You don’t have to return Promises, but it’s a handy convention
            // so the caller can always call .then() on async dispatch result.
            return Promise.resolve();
        }
        return fetchSymbolData(symbolId).then(
            resp => resp.json().then(
                ({ data, shells }) => dispatch(ensureSymbolDataLoadedAction(symbolId, data, shells)),
            ),
        );
    }
}

/** Action creator to fetch the data about a symbol and add it to the symbol table. */
export function updateNamespace() {
    return (dispatch) => {
        return fetchNamespace().then(
            resp => resp.json().then(
                ({ context, namespace }) => {
                    dispatch(updateNamespaceAction(context, namespace));
                    dispatch(resetVarListAction(namespace));
                }
            ),
        );
    }
}
