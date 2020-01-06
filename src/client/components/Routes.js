import React from 'react';
import Cookies from 'universal-cookie';
import {
  Route, Switch, withRouter, Redirect,
} from 'react-router-dom';
import config from 'payload-config';
import DefaultTemplate from './layout/DefaultTemplate';
import Dashboard from './views/Dashboard';
import Login from './views/Login';
import CreateUser from './views/CreateUser';
import MediaLibrary from './views/MediaLibrary';
import Edit from './views/collections/Edit';
import List from './views/collections/List';

const cookies = new Cookies();

const Routes = () => {
  return (
    <Route
      path="/admin"
      render={({ match }) => {
        return (
          <Switch>
            <Route
              path={`${match.url}/login`}
              render={routeProps => <Login {...routeProps} />}
            />
            <Route
              path={`${match.url}/forgot`}
              component={() => { return <h1>Forgot Password</h1>; }}
            />
            <Route
              render={() => {
                if (cookies.get('token')) {
                  return (
                    <DefaultTemplate>
                      <Route
                        path={`${match.url}/media-library`}
                        component={MediaLibrary}
                      />
                      <Route
                        path={`${match.url}/create-user`}
                        component={CreateUser}
                      />
                      <Route
                        path={`${match.url}/`}
                        exact
                        component={Dashboard}
                      />

                      {config.collections.map((collection) => {
                        const components = collection.components ? collection.components : {};
                        return (
                          <Switch key={collection.slug}>
                            <Route
                              path={`${match.url}/collections/:collectionSlug/create`}
                              exact
                              render={(routeProps) => {
                                return (
                                  <Edit
                                    {...routeProps}
                                    collection={collection}
                                  />
                                );
                              }}
                            />

                            <Route
                              path={`${match.url}/collections/:collectionSlug/:id`}
                              exact
                              render={(routeProps) => {
                                return (
                                  <Edit
                                    {...routeProps}
                                    collection={collection}
                                  />
                                );
                              }}
                            />

                            <Route
                              path={`${match.url}/collections/:collectionSlug`}
                              exact
                              render={(routeProps) => {
                                const ListComponent = components.List ? components.List : List;

                                console.log(ListComponent);
                                return (
                                  <ListComponent
                                    {...routeProps}
                                    collection={collection}
                                  />
                                );
                              }}
                            />

                          </Switch>
                        );
                      })}
                    </DefaultTemplate>
                  );
                }
                return <Redirect to="/admin/login" />;
              }}
            />
          </Switch>
        );
      }}
    />
  );
};

export default withRouter(Routes);
