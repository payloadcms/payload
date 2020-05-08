import React, { useState, useEffect } from 'react';
import {
  Route, Switch, withRouter, Redirect,
} from 'react-router-dom';
import DefaultList from './views/collections/List';
import { useUser } from './data/User';
import DefaultTemplate from './templates/Default';
import Dashboard from './views/Dashboard';
import ForgotPassword from './views/ForgotPassword';
import Login from './views/Login';
import Logout from './views/Logout';
import NotFound from './views/NotFound';
import CreateFirstUser from './views/CreateFirstUser';
import Edit from './views/collections/Edit';
import EditGlobal from './views/Global';
import { requests } from '../api';
import customComponents from './customComponents';
import RedirectToLogin from './utilities/RedirectToLogin';
import ResetPassword from './views/ResetPassword';

const { routes, collections, User } = PAYLOAD_CONFIG;

const Routes = () => {
  const [initialized, setInitialized] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    requests.get(`${routes.api}/init`).then(res => res.json().then((data) => {
      if (data && 'initialized' in data) {
        setInitialized(data.initialized);
      }
    }));
  }, []);

  return (
    <Route
      path={routes.admin}
      render={({ match }) => {
        if (initialized === false) {
          return (
            <Switch>
              <Route path={`${match.url}/create-first-user`}>
                <CreateFirstUser setInitialized={setInitialized} />
              </Route>
              <Route>
                <Redirect to={`${match.url}/create-first-user`} />
              </Route>
            </Switch>
          );
        }

        if (initialized === true) {
          return (
            <Switch>
              <Route path={`${match.url}/login`}>
                <Login />
              </Route>
              <Route path={`${match.url}/logout`}>
                <Logout />
              </Route>
              <Route path={`${match.url}/forgot`}>
                <ForgotPassword />
              </Route>
              <Route path={`${match.url}/reset/:token`}>
                <ResetPassword />
              </Route>

              <Route
                render={() => {
                  if (user) {
                    return (
                      <DefaultTemplate>
                        <Switch>
                          <Route
                            path={`${match.url}/users`}
                            exact
                            render={(routeProps) => {
                              const List = customComponents.users?.views?.List || DefaultList;
                              return (
                                <List
                                  {...routeProps}
                                  collection={User}
                                />
                              );
                            }}
                          />

                          <Route
                            path={`${match.url}/users/create`}
                            exact
                            render={(routeProps) => {
                              return (
                                <Edit
                                  {...routeProps}
                                  collection={User}
                                />
                              );
                            }}
                          />

                          <Route
                            path={`${match.url}/users/:id`}
                            exact
                            render={(routeProps) => {
                              return (
                                <Edit
                                  isEditing
                                  {...routeProps}
                                  collection={User}
                                />
                              );
                            }}
                          />

                          <Route
                            path={`${match.url}/`}
                            exact
                          >
                            <Dashboard />
                          </Route>

                          {collections.map((collection) => {
                            return (
                              <Route
                                key={`${collection.slug}-list`}
                                path={`${match.url}/collections/${collection.slug}`}
                                exact
                                render={(routeProps) => {
                                  const List = customComponents[collection.slug]?.views?.List || DefaultList;
                                  return (
                                    <List
                                      {...routeProps}
                                      collection={collection}
                                    />
                                  );
                                }}
                              />
                            );
                          })}

                          {collections.map((collection) => {
                            return (
                              <Route
                                key={`${collection.slug}-create`}
                                path={`${match.url}/collections/${collection.slug}/create`}
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
                            );
                          })}

                          {collections.map((collection) => {
                            return (
                              <Route
                                key={`${collection.slug}-edit`}
                                path={`${match.url}/collections/${collection.slug}/:id`}
                                exact
                                render={(routeProps) => {
                                  return (
                                    <Edit
                                      isEditing
                                      {...routeProps}
                                      collection={collection}
                                    />
                                  );
                                }}
                              />
                            );
                          })}

                          {config.globals && config.globals.map((global) => {
                            return (
                              <Route
                                key={`${global.slug}`}
                                path={`${match.url}/globals/${global.slug}`}
                                exact
                                render={(routeProps) => {
                                  return (
                                    <EditGlobal
                                      {...routeProps}
                                      global={global}
                                    />
                                  );
                                }}
                              />
                            );
                          })}
                        </Switch>
                      </DefaultTemplate>
                    );
                  }
                  return <RedirectToLogin />;
                }}
              />
              <Route path={`${match.url}*`}>
                <NotFound />
              </Route>
            </Switch>
          );
        }

        return null;
      }}
    />
  );
};

export default withRouter(Routes);
