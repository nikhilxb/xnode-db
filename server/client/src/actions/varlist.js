/** Action type definitions. */
export const ExampleActions = {  // Must take form of `[module]Actions`
    SYNC_ACTION:  "EXAMPLE::SYNC_ACTION",
    ASYNC_ACTION: "EXAMPLE::ASYNC_ACTION",
};

// TODO: Feature grouping
// ----------------------

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