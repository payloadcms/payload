import React from 'react';
import { Route, Switch, withRouter } from 'react-router-dom';

import Logo from '../components/graphics/Logo';
import Icon from '../components/graphics/Icon';

import {
  CollectionRoutes,
  DefaultTemplate,
  Dashboard,
  Login,
  CreateUser
} from 'payload/components';

const Routes = props => {
  return (
    <Switch>
      <Route path="/login" render={ routeProps => <Login logo={Logo} {...routeProps} />} />
      <Route path="/forgot" component={ () => { return <h1>Forgot Password</h1>; } } />
      <Route path="/" render={routeProps => {
        return (
          <DefaultTemplate {...routeProps} icon={Icon}>
            <Route path="/create-user" component={CreateUser} />
            <Route path="/" exact component={Dashboard} />
            <CollectionRoutes collections={props.collections} views={props.views} />
          </DefaultTemplate>
        );
      }} />
    </Switch>
  );
}

export default withRouter(Routes);
