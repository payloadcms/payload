import React, { useState, useEffect } from 'react';
import {
  Route, Switch, withRouter, Redirect, useHistory,
} from 'react-router-dom';
import { useConfig } from './providers/Config';
import List from './views/collections/List';
import { useAuthentication } from './providers/Authentication';
import DefaultTemplate from './templates/Default';
import Dashboard from './views/Dashboard';
import ForgotPassword from './views/ForgotPassword';
import Login from './views/Login';
import Logout from './views/Logout';
import NotFound from './views/NotFound';
import Verify from './views/Verify';
import CreateFirstUser from './views/CreateFirstUser';
import Edit from './views/collections/Edit';
import EditGlobal from './views/Global';
import { requests } from '../api';
import ResetPassword from './views/ResetPassword';
import Unauthorized from './views/Unauthorized';
import Account from './views/Account';
import Loading from './elements/Loading';

const Routes = () => {
  const history = useHistory();
  const [initialized, setInitialized] = useState(null);
  const { user, permissions, permissions: { canAccessAdmin } } = useAuthentication();

  const {
    admin: { user: userSlug }, routes, collections, globals,
  } = useConfig();

  useEffect(() => {
    requests.get(`${routes.api}/${userSlug}/init`).then((res) => res.json().then((data) => {
      if (data && 'initialized' in data) {
        setInitialized(data.initialized);
      }
    }));
  }, [routes, userSlug]);

  useEffect(() => {
    history.replace();
  }, [history]);

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
              <Route path={`${match.url}/logout-inactivity`}>
                <Logout inactivity />
              </Route>
              <Route path={`${match.url}/forgot`}>
                <ForgotPassword />
              </Route>
              <Route path={`${match.url}/reset/:token`}>
                <ResetPassword />
              </Route>

              {collections.map((collection) => {
                if (collection?.auth?.emailVerification) {
                  return (
                    <Route
                      key={`${collection.slug}-verify`}
                      path={`${match.url}/${collection.slug}/verify/:token`}
                      exact
                    >
                      <Verify />
                    </Route>
                  );
                }
                return null;
              })}

              <Route
                render={() => {
                  if (user) {
                    if (canAccessAdmin) {
                      return (
                        <DefaultTemplate>
                          <Switch>
                            <Route
                              path={`${match.url}/`}
                              exact
                            >
                              <Dashboard />
                            </Route>

                            <Route path={`${match.url}/account`}>
                              <Account />
                            </Route>

                            {collections.map((collection) => (
                              <Route
                                key={`${collection.slug}-list`}
                                path={`${match.url}/collections/${collection.slug}`}
                                exact
                                render={(routeProps) => {
                                  if (permissions?.[collection.slug]?.read?.permission) {
                                    return (
                                      <List
                                        {...routeProps}
                                        collection={collection}
                                      />
                                    );
                                  }

                                  return <Unauthorized />;
                                }}
                              />
                            ))}

                            {collections.map((collection) => (
                              <Route
                                key={`${collection.slug}-create`}
                                path={`${match.url}/collections/${collection.slug}/create`}
                                exact
                                render={(routeProps) => {
                                  if (permissions?.[collection.slug]?.create?.permission) {
                                    return (
                                      <Edit
                                        {...routeProps}
                                        collection={collection}
                                      />
                                    );
                                  }

                                  return <Unauthorized />;
                                }}
                              />
                            ))}

                            {collections.map((collection) => (
                              <Route
                                key={`${collection.slug}-edit`}
                                path={`${match.url}/collections/${collection.slug}/:id`}
                                exact
                                render={(routeProps) => {
                                  if (permissions?.[collection.slug]?.read?.permission) {
                                    return (
                                      <Edit
                                        isEditing
                                        {...routeProps}
                                        collection={collection}
                                      />
                                    );
                                  }

                                  return <Unauthorized />;
                                }}
                              />
                            ))}

                            {globals && globals.map((global) => (
                              <Route
                                key={`${global.slug}`}
                                path={`${match.url}/globals/${global.slug}`}
                                exact
                                render={(routeProps) => {
                                  if (permissions?.[global.slug]?.read?.permission) {
                                    return (
                                      <EditGlobal
                                        {...routeProps}
                                        global={global}
                                      />
                                    );
                                  }

                                  return <Unauthorized />;
                                }}
                              />
                            ))}

                            <Route path={`${match.url}*`}>
                              <NotFound />
                            </Route>
                          </Switch>
                        </DefaultTemplate>
                      );
                    }

                    if (canAccessAdmin === false) {
                      return <Unauthorized />;
                    }

                    return <Loading />;
                  }

                  if (user === undefined) {
                    return <Loading />;
                  }
                  return <Redirect to={`${match.url}/login`} />;
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
