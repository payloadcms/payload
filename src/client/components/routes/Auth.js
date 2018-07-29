import React, { Component } from 'react';
import { Route } from 'react-router-dom';
import Login from 'payload/client/components/views/Login';

class AuthRoutes extends Component {
  render() {
    return (
      <Route exact path="/" component={Login} />
    );
  }
}

export default AuthRoutes;
