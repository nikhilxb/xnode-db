import React, { Component } from 'react';

class DataViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      'payload': 0,
    }
  }
  render() {
    return (<div>{this.state.payload}</div>);
  }
}

export default DataViewer;
