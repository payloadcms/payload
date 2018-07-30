import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import Login from './views/Login';
import AdminTemplate from './layout/AdminTemplate';

class Routes extends Component {
  render() {
    return (
      <React.Fragment>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/forgot" component={ () => { return <h1>Forgot Password</h1>; } } />
          <Route path="/" component={AdminTemplate} />
        </Switch>
      </React.Fragment>
    );
  }
}

export default Routes;
