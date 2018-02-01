import React, { Component } from 'react';

class DataViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      'vizschema': {'data': ''},
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
        this.setState({'vizschema' : {'data': results[0].cell}});
      });
  }
}

export default DataViewer;
