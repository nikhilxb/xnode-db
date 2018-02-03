import React, { Component } from 'react';
import DataViewer from './DataViewer.js'

class CharViewer extends DataViewer {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>{this.state.vizschema.data}</div>
    );
  }
}

export default CharViewer;
