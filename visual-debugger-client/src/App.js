import React, { Component } from 'react';
import DataViewer from './DataViewer.js';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        <DataViewer></DataViewer>
      </div>
    );
  }
}

export default App;
