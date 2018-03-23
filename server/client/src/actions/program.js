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
export function updateNamespaceAction(programState, stackFrame, namespace) {
    return {
        type: SymbolTableActions.UPDATE_NAMESPACE,
        programState,
        stackFrame,
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
                let type = getState().program.symbolTable[symbolId].type;
                let viewerData = getState().program.symbolTable[symbolId].data.viewer;
                let dispatches = [];
                if (type === 'graphdata' && viewerData.creatorop !== null) {
                    confirmed.add(viewerData.creatorop);
                    dispatches.push(ensureGraphLoadedRecurseActionThunk(viewerData.creatorop, confirmed));
                }
                else if (type === 'graphop') {
                    // TODO clean this up
                    let argArrs = viewerData.args.concat(viewerData.kwargs);
                    argArrs.forEach(argArr => {
                       if (argArr.length === 1) {
                           return;
                       }
                       if (Array.isArray(argArr[1])) {
                           argArr[1].forEach(arg => {
                               if(!confirmed.has(arg)) {
                                   confirmed.add(arg);
                                   dispatches.push(ensureGraphLoadedRecurseActionThunk(arg, confirmed));
                               }
                           });
                       }
                       else {
                           if(!confirmed.has(argArr[1])) {
                               confirmed.add(argArr[1]);
                               dispatches.push(ensureGraphLoadedRecurseActionThunk(argArr[1], confirmed));
                           }
                       }
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
                confirmed.forEach(symbolId => graphState[symbolId] = {expanded: false});  // TODO move this fn elsewhere
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
        const dataInCache = getState().program.symbolTable[symbolId].data;
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
                    dispatch(updateNamespaceAction('waiting', context, namespace));
                    dispatch(resetVarListAction(namespace));
                }
            )
        ).catch(
            error => {
                // TODO currently end-of-program behavior is addressed here and in controlbar.js. Find a way to unify
                dispatch(updateNamespaceAction('disconnected', null, {}))
            }
        );
    }
}
