import React from 'react';
import { Route } from 'react-router-dom';
import Login from '../views/Login';

export default () => {
  return (
    <React.Fragment>
      <Route path="/login" exact component={Login} />
      <Route path="/forgot" component={ () => { return <h1>Forgot Password</h1>; } } />
    </React.Fragment>
  );
};
