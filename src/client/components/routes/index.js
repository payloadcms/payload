import React from 'react';
import Cookies from 'universal-cookie';
import { Route, Switch, withRouter, Redirect } from 'react-router-dom';
import CollectionRoutes from './Collections';
import DefaultTemplate from '../layout/DefaultTemplate';
import Dashboard from '../views/Dashboard';
import Login from '../views/Login';
import CreateUser from '../views/CreateUser';
import MediaLibrary from '../views/MediaLibrary';

const cookies = new Cookies();

const Routes = props => {
  return (
    <Switch>
      <Route path="/login" render={routeProps => <Login {...routeProps} />} />
      <Route path="/forgot" component={() => { return <h1>Forgot Password</h1>; }} />
      <Route path="/" render={routeProps => {
        if (cookies.get('token')) {
          return (
            <DefaultTemplate {...routeProps}>
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
