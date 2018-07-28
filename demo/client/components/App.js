import React, { Component } from 'react';
import { Switch, withRouter, Route } from 'react-router-dom';

import Login from 'payload/client/components/views/Login';

import 'payload/client/scss/app.css';

class App extends Component {
  render() {

    return (
      <div>
        <React.Fragment>
          <Switch location={this.props.location}>
            <Route exact path="/" component={Login} />
          </Switch>
        </React.Fragment>
      </div>
    )
  }
}

export default withRouter(App);
