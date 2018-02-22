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

function anotherActionThunk(value) {
    return (dispatch) => {
        return Promise.resolve().then(dispatch(syncAction(value)));
    }
}

/** Action creator to ___ then ___ if ___. */
export function asyncActionThunk(value) {  // Must take form of `[name]Thunk`
    return (dispatch, getState) => {
        let nodispatchCondition =  getState().nodispatchCondition;
        if (nodispatchCondition) {
            return Promise.resolve();
        }
        else {
            return dispatch(anotherActionThunk(value)).then(
                () => {
                    dispatch(syncAction(value));
                    dispatch(syncAction(value));
                }
            ).catch((error) => console.log(error));
        }
    }
}