"use strict";

import {loadGlobals, loadSymbol, REF} from './mockdata.js';

// TODO: Need to find way of running test without having to go through Webpack server (which currently is needed for
// transpiling, etc.)
console.log(loadGlobals());
console.log(loadSymbol(`${REF}006`));
console.log(loadSymbol(`${REF}106`));
console.log(loadSymbol(`${REF}206`));