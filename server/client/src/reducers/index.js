import { combineReducers } from 'redux-seamless-immutable';
import symbolTableReducer  from './symboltable.js';
import canvasReducer       from './canvas.js';

/** Highest-level reducer for store root. Simply dispatches to other reducers. */
const mainReducer = combineReducers({
    symboltable:    symbolTableReducer,
    canvas:         canvasReducer,
});

export default mainReducer;