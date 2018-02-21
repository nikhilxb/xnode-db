import { handle } from 'redux-pack';
import Immutable from 'seamless-immutable';
import { ExampleActions } from '../actions/example';

/** Root reducer's initial state slice. */
const initialState = Immutable({

});

/** TODO: Short description of root reducer for state slice. */
export default function rootReducer(state = initialState, action) {
    const { type } = action;
    switch(type) {
        case ExampleActions.SYNC_ACTION:
            return syncReducer(state, action);
        case ExampleActions.ASYNC_ACTION:
            return asyncReducer(state, action);
    }
    return state;  // No effect by default
};

/** TODO: Reducer for synchronous action. */
function syncReducer(state, action) {
    return state;
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