# Client
This front-end view is a React app that is rendered in the browser.

## Structure
The structure is inspired from:
https://hackernoon.com/the-100-correct-way-to-structure-a-react-app-or-why-theres-no-such-thing-3ede534ef1ed
https://medium.com/alexmngn/how-to-better-organize-your-react-applications-2fd3ea1920f1

```$xslt
src/
    components/                     // reusable components
    views/                          // each separate route in view
        Debugger/                   // one folder per component
            Debugger.js             // component's React code
            Debugger.css            // component's CSS
            Debugger.test.js        // component's unit tests
            index.js                // export folder for nice importing
``` 