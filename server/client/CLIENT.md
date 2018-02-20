# Client
This front-end view is a React app that is rendered in the browser.

## Structure
The structure is inspired from:

<https://hackernoon.com/the-100-correct-way-to-structure-a-react-app-or-why-theres-no-such-thing-3ede534ef1ed>
https://medium.com/alexmngn/how-to-better-organize-your-react-applications-2fd3ea1920f1
https://levelup.gitconnected.com/structure-your-react-redux-project-for-scalability-and-maintainability-618ad82e32b7
https://github.com/rwieruch/favesound-redux/blob/master/src/reducers/player/index.js
https://github.com/devtools-html/debugger.html

```
src/
    components/                     // reusable components
    views/                          // each separate route in view
        Debugger/                   // one folder per component
            Debugger.js             // component's React code
            Debugger.css            // component's CSS
            Debugger.test.js        // component's unit tests
            index.js                // export folder for nice importing
```

Reducers should mirror the shape of the state.
To decompose actions from reducers?
What should state shape be?

To use bound action creators? http://blog.isquaredsoftware.com/2016/10/idiomatic-redux-why-use-action-creators/
Within actions: will call `dispatch(subroutineAction())`
Within components: will use `connect(mapPropsToActions)`

Difference between UI layer (components, containers) and state layer (actions, reducers, store shape):

- The state should be broken down in a way that **makes sense for the app**.
- The reducers should be broken down in a way that **mirrors the shape of the state**.
- The actions should be broken down in a way that **encapsulates individual features**.

symbolTable
highlightedSymbols

`combineReducers` is a nice pattern because it tends to enforce the idea that the reducers should be scoped to
non-overlapping subsets of the store, decoupled from the structure of the store itself. It takes the opinion that you
should be reducing the leaves, not the branches, and it handles the reduction of the branches.

This seemingly common-sense approach took much thinking — follow it with care. Here's what we know with strong 
conviction:
 - All state is stored in a global store. (Including UI?)
 - State structure is decoupled from the view structure. The mapStateToProps functions are very helpful (SHOW EXAMPLE).
 - Modularity in state structure yields easy extensibility. Nesting provides a "chain of command" that reduces 
 cognitive overload by leveraging information hiding and abstraction.
 - Reducers must be decomposed according to the state shape (so they can be composed).
 
Here are additional contraints in line with the above principles:
 - Actions should minimize the number of slice of the state that are affected, i.e. 
 
## UI Library
Material UI v1
CSS-in-JS

## React
PropsTypes

## Redux
React-Redux
Redux Thunk: https://github.com/gaearon/redux-thunk
Seamless-immutable: https://github.com/rtfeldman/seamless-immutable (not Immutable.js)
npm install redux-seamless-immutable
Redux Pack: https://github.com/lelandrichardson/redux-pack


## Watching
Normalizer: https://github.com/paularmstrong/normalizr

## Good resources:
https://lorenstewart.me/2016/11/27/a-practical-guide-to-redux/