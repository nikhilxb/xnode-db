import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';

import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux'

import Debugger from './views/Debugger';
import mainReducer from './reducers';

// Create store & link to main reducer
let store = createStore(mainReducer, applyMiddleware(thunk));

// Link app to HTML
ReactDOM.render(
    <Provider store={store}>
        <Debugger />
    </Provider>,
    document.getElementById('root')
);
registerServiceWorker();
