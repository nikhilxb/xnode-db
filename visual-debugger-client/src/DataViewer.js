import React, { Component } from 'react';

class DataViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      'vizschema': 'hello world!',
    };
  }

  componentDidMount() {
    this.requestVizSchema();
  }

  requestVizSchema(){
    fetch('https://randomuser.me/api/')
      .then(results => {
        return results.json();
      })
      .then(({ results }) => {
        this.setState({'vizschema' : results});
      })
  }

  render() {
    return (
      <div>{this.state.vizschema[0].cell}</div>
    );
  }
}

export default DataViewer;
