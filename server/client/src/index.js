import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

import Debugger from './views/Debugger';

ReactDOM.render(<Debugger />, document.getElementById('root'));
registerServiceWorker();
