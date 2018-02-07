import React, { Component } from 'react';
import StringViewer from './data-viewers/StringViewer.js';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <StringViewer symbol="x" />
      </div>
    );
  }
}

export default App;
