import React, { Component } from 'react';
import DataViewer from './DataViewer.js'

class NumberViewer extends DataViewer {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>{this.state.vizschema.data}</div>
    );
  }
}

export default NumberViewer;
