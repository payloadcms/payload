import React from 'react';
import Cookies from 'universal-cookie';
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import {
  CollectionRoutes,
  DefaultTemplate,
  Dashboard,
  Login,
  CreateUser,
  MediaLibrary
} from 'payload/components';
import Logo from '../components/graphics/Logo';
import Icon from '../components/graphics/Icon';

const cookies = new Cookies();

const Routes = props => {
  return (
    <Switch>
      <Route path="/login" render={routeProps => <Login logo={Logo} {...routeProps} />} />
      <Route path="/forgot" component={() => { return <h1>Forgot Password</h1>; }} />
      <Route path="/" render={routeProps => {
        if (cookies.get('token')) {
          return (
            <DefaultTemplate {...routeProps} icon={Icon}>
              <Route path="/media-library" component={MediaLibrary} />
              <Route path="/create-user" component={CreateUser} />
              <Route path="/" exact component={Dashboard} />
              <CollectionRoutes views={props.views} />
            </DefaultTemplate>
          );
        }
        return <Redirect to="/login" />
      }} />
    </Switch>
  );
}

export default withRouter(Routes);
