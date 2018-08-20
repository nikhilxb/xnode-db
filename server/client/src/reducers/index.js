import { combineReducers } from 'redux-seamless-immutable';
import programReducer      from './program.js';
import canvasReducer       from './canvas.js';
import varListReducer      from './varlist.js';

/** Highest-level reducer for store root. Simply dispatches to other reducers. */
const mainReducer = combineReducers({
    program:        programReducer,
    canvas:         canvasReducer,
    varlist:        varListReducer,
});

export default mainReducer;
