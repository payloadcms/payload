import React, { Component } from 'react';
import { Switch, withRouter, Route } from 'react-router-dom';
import Sidebar from 'payload/client/components/layout/Sidebar';

import '../scss/app.css';

class App extends Component {
  render() {
    return (
      <div>
        <Sidebar />
        <h1>Here's the main h1</h1>
      </div>
    )
  }
}

export default App;
