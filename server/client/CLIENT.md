# Client
The `client` is front-end React app that is rendered in the browser.

## Development env
The codebase was initialized using `create-react-app`, so that documentation will be useful to consult.

It provides the scripts:
- `npm start`, which launches a development server to serve the app.
- `npm build`, which prepares a bundle for production. This means *minifying* the code (and generating *sourcemaps*
 that allow us to rehydrate the minified code); adding *hashes* to the end of filenames so that browser caches can be 
 more effective; and *bundling* the files to that all the scripts reside in a single file. The output of this is a 
 folder that can be placed on some server, from which content is served.
- `npm test`, which presumably allows us to run unit tests but how exactly is not clear. **(TODO)**


## Structure
The codebase structure is **decidedly non-arbitrary** and crucial for: (1) reducing complexity, (2) encouraging 
encapsulated design, and (3) enabling scalability.

After exploring much of the literature — like
[this](https://hackernoon.com/the-100-correct-way-to-structure-a-react-app-or-why-theres-no-such-thing-3ede534ef1ed),
[this](https://medium.com/alexmngn/how-to-better-organize-your-react-applications-2fd3ea1920f1), and
[this](https://levelup.gitconnected.com/structure-your-react-redux-project-for-scalability-and-maintainability-618ad82e32b7)
(worth skimming) — as well as real-world applications — like
[this](https://github.com/rwieruch/favesound-redux/) and
[this](https://github.com/devtools-html/debugger.html/) (definitely should look through) ...

... I settled on the following structure, which instantiates the philosophy of separating the concerns of the
*UI layer* (views, components) and the *application state layer* (actions, reducers, services):

```
src/
├── views/
│   ├── Debugger/
│   │   ├── Debugger.js
│   │   ├── Debugger.test.js
│   └── └── index.js
├── components/
│   ├── viewers/
│   │   ├── GraphViewer/
│   │   │   ├── GraphViewer.js
│   │   └── └── GraphViewer.test.js
│   ├── ViewerFrame
│   │   ├── ViewerFrame.js
│   └── └── ViewerFrame.test.js
├── actions/
│   └── example1.js
├── reducers/
│   ├── example2.js
│   ├── subexample/
│   │   ├── index.js
│   └── └── example3.js
├── services/
│   └── mockdata.js
├── index.js
├── index.css
└── registerServiceWorker.js
examples/
└── ...
public/
├── index.html
└── ...
```

### UI layer

A common distinction made in React is between
([learn more](https://www.fullstackreact.com/p/using-presentational-and-container-components-with-redux/)):
- *dumb components* — aka "presentational"; general-purpose; simply render 
what their parents tell them to through `props`
- *smart components* — aka "container"; single-use; interface with 
reading/changing the data/state directly

|                | Dumb components                  | Smart components                               |
|----------------|----------------------------------|------------------------------------------------|
| Purpose        | How things look (markup, styles) | How things work (data fetching, state updates) |
| Aware of Redux | No                               | Yes                                            |
| To read data   | Read data from props             | Subscribe to Redux state                       |
| To change data | Invoke callbacks from props      | Dispatch Redux actions                         |
| Are written    | By hand                          | By react-redux connect()                       |


TODO



Reducers should mirror the shape of the state.
To decompose actions from reducers?
What should state shape be?

To use bound action creators? http://blog.isquaredsoftware.com/2016/10/idiomatic-redux-why-use-action-creators/
Within actions: will call `dispatch(subroutineAction())`
Within smart components components: can use `connect(mapPropsToActions)` to make it a dumb component


Difference between UI layer (components, containers) and state layer (actions, reducers, store shape):

- The state should be broken down in a way that **makes sense for the app**.
- The reducers should be broken down in a way that **mirrors the shape of the state**.
- The actions should be broken down in a way that **encapsulates individual features**.

symbolTable
highlightedSymbols

imple things become when storing flat, normalized data in the Redux store, with selectors querying the store as needed.

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


## Tech Stack

### User interface  library
#### `material-ui-next` (v1) — React components implementing Material Design
Website: <https://material-ui-next.com/>

*Important note:* using the v1 (beta) version not v0 (stable). This is recommended by the developers, and so much 
better from a styling/composability standpoint.

Also, it uses the CSS-in-JS approach (`withStyles()`) which allows CSS to be defined along with the `Component` in 
Javascript. This is nicer maintaining a separate `.css` file, and we currently use `withStyles()` to style all
custom React `Components`, not just those from the Material UI library.

### React
#### `props-types` — Type-checking for `this.props`
Website: <https://github.com/facebook/prop-types>

It provides us with clear expectations about what is being passed to `Component`s. Otherwise, the develop may be 
left guessing since `this.props` is dynamic and sometimes injected indirectly (e.g. Redux's `mapStateToProps`).
Will emit warnings in development mode if types do not match.

### Redux
#### `redux` / `react-redux` — Official Redux bindings for React
Website: <https://github.com/reactjs/react-redux>

This project uses Redux because it allows for a clean separation of the UI layer and application state layer in a 
React app.

#### `seamless-immutable` — Immutable Javascript objects
Website: <https://github.com/rtfeldman/seamless-immutable>

An immutable object library helps prevent accidental state mutation which violates the Redux immutability requirement.
It also makes deep mutation/merging a lot easier, without requiring complex applications of the `...state` spread 
operator.

The `Immutable.js` library was considered but deemed too intrusive; it would quickly permeate the entire codebase. 
Further, it required new unfamiliar syntax to use.

The `seamless-immutable` library provides objects that look a lot like typical Javascript objects, and does not 
require new syntax for read-only operations. Write operations create a new immutable copy of the object.

#### `redux-seamless-immutable` — Replacements of Redux functions to play nice with immutable objects
Website: <https://github.com/eadmundo/redux-seamless-immutable>

In particular, it provides a new `combineReducers()` used for composing smaller reducer functions.

#### `redux-thunk` — Middleware to return functions from action creators
Website: <https://github.com/gaearon/redux-thunk>

Redux Thunk middleware allows you to write action creators that return a function instead of an action. The thunk can be
used to delay the dispatch of an action, or to dispatch only if a certain condition is met. The inner function receives
the store methods `dispatch()` and `getState()` as parameters.

Useful for complex async operations, though a lot of simple async operations are handled more cleanly with `redux-pack`.

#### `redux-pack` — Middleware to deal with promises in action objects
Website: <https://github.com/lelandrichardson/redux-pack>

Provides a really clean way to schedule async operation (e.g. API fetches) with promises, that doesn't require 
defining separate action types for start, success, failure modes.

Usage is demonstrated in the `examples` templates. Note that it is very similar to creating typical non-promise action 
objects.

#### Further reading
- [Redux Official Documentation](https://redux.js.org/introduction) (45 min read) — The first stop for learning Redux. 
In particular, the "Motivation" and "Basics" sections are a must.
- [A Practical Guide to Redux](https://lorenstewart.me/2016/11/27/a-practical-guide-to-redux/) (30 min read) — 
Concise, remarkably thorough walkthrough of advanced Redux patterns useful for complex projects like this one.


# Miscellaneous
Normalizer: <https://github.com/paularmstrong/normalizr>
