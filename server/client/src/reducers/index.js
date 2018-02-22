import { combineReducers } from 'redux-seamless-immutable';
import symbolTableReducer  from './symboltable.js';
import varListReducer from './varlist.js';

/** Highest-level reducer for store root. Simply dispatches to other reducers. */
const mainReducer = combineReducers({
    symboltable: symbolTableReducer,
    varlist: varListReducer,
});

export default mainReducer;
