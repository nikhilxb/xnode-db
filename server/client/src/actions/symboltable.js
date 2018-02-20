/** Action type definitions. */
export const SymbolTableActions = {  // Must take form of `[module]Actions`
    GET_SYMBOL_SHELL:  "SYMBOLTABLE::",
    GET_SYMBOL_SHELL:  "SYMBOLTABLE::",
};

// TODO: Feature grouping
// ----------------------

/** Action creator to ensure the . */
export function getSymbolShellAction(symbolId) {
    return {
        type: ExampleActions.SYNC_ACTION,
        value  // ES6 shorthand for `value: value`
    };
};

/** Action creator to __. */
export function syncAction(value) {  // Must take form of `[name]Action`
    return {
        type: ExampleActions.SYNC_ACTION,
        value  // ES6 shorthand for `value: value`
    };
};

/** Action creator to __. */
export function asyncAction(value) {
    return {
        type: ExampleActions.ASYNC_ACTION,
        promise: null,  // e.g. `fetch(value)` or some other async action that returns Promise (see redux-pack docs)
        meta: {
            onSuccess: (result, getState) => {
                // for chaining Promises: can make another call here
            }
        }
    };
};