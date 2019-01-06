import React from 'react';
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import {
  CollectionRoutes,
  DefaultTemplate,
  Dashboard,
  Login,
  CreateUser
} from 'payload/components';
import Logo from '../components/graphics/Logo';
import Icon from '../components/graphics/Icon';
import config from '../../payload.config.json';

const Routes = props => {
  return (
    <Switch>
      <Route path="/login" render={routeProps => <Login logo={Logo} {...routeProps} />} />
      <Route path="/forgot" component={() => { return <h1>Forgot Password</h1>; }} />
      <Route path="/" render={routeProps => {

        if (true) {
          return (
            <DefaultTemplate {...routeProps} icon={Icon}>
              <Route path="/create-user" component={CreateUser} />
              <Route path="/" exact component={Dashboard} />
              <CollectionRoutes collections={props.collections} views={props.views} config={config} />
            </DefaultTemplate>
          );
        }

        return <Redirect to="/login" />
      }} />
    </Switch>
  );
}

export default withRouter(Routes);
