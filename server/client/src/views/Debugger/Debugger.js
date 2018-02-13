import './Debugger.css';
import React, { Component } from 'react';

// Material UI
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import {List, ListItem} from 'material-ui/List';

/**
 * This class ___.
 */
class Debugger extends Component {

    innerDivStyle = {paddingBottom: "16px", paddingTop: "16px"};

    /**
     * Renders ___.
     */
    render() {
        return (
            <MuiThemeProvider>
                <div className="Debugger-container">
                    <div className="Debugger-sidebar">
                        <List >
                            <ListItem primaryText="myInt : 0"
                                      className="Debugger-sidebar-elem"
                                      innerDivStyle={this.innerDivStyle}/>
                            <ListItem primaryText="myFloat : 3.14"
                                      className="Debugger-sidebar-elem"
                                      innerDivStyle={this.innerDivStyle}/>
                            <ListItem primaryText="myString : 'Herro world!'"
                                      className="Debugger-sidebar-elem"
                                      innerDivStyle={this.innerDivStyle}/>
                            <ListItem primaryText="myDict : Dict[6]"
                                      className="Debugger-sidebar-elem"
                                      innerDivStyle={this.innerDivStyle}
                                      nestedItems={[
                                          <ListItem primaryText="['key1'] = 'val1'"
                                                    className="Debugger-sidebar-elem"
                                                    innerDivStyle={this.innerDivStyle}/>,
                                          <ListItem primaryText="[List[3]] = 'val1'"
                                                    className="Debugger-sidebar-elem"
                                                    innerDivStyle={this.innerDivStyle}/>
                                      ]}/>
                            <ListItem primaryText="myList : List[6]"
                                      className="Debugger-sidebar-elem"
                                      innerDivStyle={this.innerDivStyle}
                                      nestedItems={[
                                          <ListItem primaryText="[0] = 1"
                                                    className="Debugger-sidebar-elem"
                                                    innerDivStyle={this.innerDivStyle}/>,
                                          <ListItem primaryText="[1] = 1"
                                                    className="Debugger-sidebar-elem"
                                                    innerDivStyle={this.innerDivStyle}/>,
                                          <ListItem primaryText="[2] = 2"
                                                    className="Debugger-sidebar-elem"
                                                    innerDivStyle={this.innerDivStyle}/>,
                                          <ListItem primaryText="[3] = 3"
                                                    className="Debugger-sidebar-elem"
                                                    innerDivStyle={this.innerDivStyle}/>,
                                          <ListItem primaryText="[4] = 5"
                                                    className="Debugger-sidebar-elem"
                                                    innerDivStyle={this.innerDivStyle}/>,
                                      ]}/>
                        </List>
                    </div>
                    <div className="Debugger-canvas">
                    </div>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default Debugger;
