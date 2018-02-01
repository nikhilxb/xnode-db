import React, { Component } from 'react';
import DataViewer from './DataViewer.js';
import CharViewer from './CharViewer.js';

class StringViewer extends DataViewer {
  constructor(props) {
    super(props);
  }

  componentDidMount(){
    super.componentDidMount();
    this.setState({
      'charViewers': [],
    });
  }

  toggleCharViewer(i) {
    let viewers = this.state.charViewers;
    viewers.push(<CharViewer />);
    this.setState({
      'charViewers': viewers,
    });
  }

  render() {
    const chars = this.state.vizschema.data.split('').map(
      (char, index) =>
      <button onClick={() => this.toggleCharViewer(index)}>{char}</button>
    );
    return (
      <div>
        <div>{this.state.charViewers}</div>
        <div>{chars}</div>
      </div>
    );
  }
}

export default StringViewer;
