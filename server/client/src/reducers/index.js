import { combineReducers } from 'redux-seamless-immutable';
import symbolTableReducer  from './symboltable.js';

/** Highest-level reducer for store root. Simply dispatches to other reducers. */
const mainReducer = combineReducers({
    symboltable: symbolTableReducer,
});

export default mainReducer;