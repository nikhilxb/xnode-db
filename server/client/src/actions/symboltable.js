import { REF } from '../services/mockdata.js';

import { resetVarListAction } from './varlist.js';
import { setInViewerPayloadAction } from './canvas.js';

/** Action type definitions. */
export const SymbolTableActions = {
    ENSURE_SYMBOL_DATA_LOADED:  "SYMBOLTABLE::ENSURE_SYMBOL_DATA_LOADED",
    UPDATE_NAMESPACE:           "SYMBOLTABLE::UPDATE_NAMESPACE",
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
}

function fetchNamespace() {
    return fetch('/api/debug/get_namespace');
}

/** Action which resets the symbol table to contain a new namespace. */
export function updateNamespaceAction(context, namespace) {
    return {
        type: SymbolTableActions.UPDATE_NAMESPACE,
        context,
        namespace,
    };
}

/**
 * Loads the data for `symbolId` if needed, then calls itself for each parent of the symbol, thereby building the graph.
 * This function can be dispatched and chained with `.then()` statements, which will only execute when the graph has
 * loaded completely.
 */
function ensureGraphLoadedRecurseActionThunk(symbolId, confirmed) {
    return (dispatch, getState) => {
        return dispatch(ensureSymbolDataLoadedActionThunk(symbolId)).then(
            () => {
                confirmed.add(symbolId);
                let type = getState().symboltable[symbolId].type;
                let viewerData = getState().symboltable[symbolId].data.viewer;
                let dispatches = [];
                if (type === 'graphdata' && viewerData.creatorop !== null) {
                    confirmed.add(viewerData.creatorop);
                    dispatches.push(ensureGraphLoadedRecurseActionThunk(viewerData.creatorop, confirmed));
                }
                else if (type === 'graphop') {
                    viewerData.args.filter(arg => arg !== null && !confirmed.has(arg)).forEach(arg => {
                        confirmed.add(arg);
                        dispatches.push(ensureGraphLoadedRecurseActionThunk(arg, confirmed));
                    });
                    Object.values(viewerData.kwargs).filter(kwarg => !confirmed.has(kwarg)).forEach(kwarg => {
                        confirmed.add(kwarg);
                        dispatches.push(ensureGraphLoadedRecurseActionThunk(kwarg, confirmed));
                    });
                }
                if (viewerData.container && !confirmed.has(viewerData.container)) {
                    confirmed.add(viewerData.container);
                    dispatches.push(ensureGraphLoadedRecurseActionThunk(viewerData.container, confirmed));
                }
                return Promise.all(dispatches.map(fn => dispatch(fn)));
            }
        )
    }
}

/**
 * Checks if a graph starting at `symbolId` has been loaded, and loads it if it has not. Then, it sets the
 * `hasLoadedGraph` property of the viewer containing the graph to `true`.
 */
export function ensureGraphLoadedActionThunk(symbolId, viewerId) {
    return (dispatch) => {
        let confirmed = new Set();
        return dispatch(ensureGraphLoadedRecurseActionThunk(symbolId, confirmed)).then(
            () => {
                let graphState = {};
                confirmed.forEach(symbolId => graphState[symbolId] = {expanded: true});
                dispatch(setInViewerPayloadAction(viewerId, ['stateChanged'], true));
                dispatch(setInViewerPayloadAction(viewerId, ['graphLoaded'], true));
                dispatch(setInViewerPayloadAction(viewerId, ['graphState'], graphState));
            },
        )
    }
}

/** Action creator to fetch the data about a symbol and add it to the symbol table; only executes if the symbol data
    has not already been loaded. */
export function ensureSymbolDataLoadedActionThunk(symbolId) {
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
export function updateNamespaceActionThunk() {
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
