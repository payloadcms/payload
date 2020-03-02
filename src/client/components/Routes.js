import React, { useState, useEffect } from 'react';
import {
  Route, Switch, withRouter, Redirect,
} from 'react-router-dom';
import List from './views/collections/List';
import config from '../config/sanitizedClientConfig';
import { useUser } from './data/User';
import Dashboard from './views/Dashboard';
import Login from './views/Login';
import Logout from './views/Logout';
import NotFound from './views/NotFound';
import CreateFirstUser from './views/CreateFirstUser';
import MediaLibrary from './views/MediaLibrary';
import Edit from './views/collections/Edit';
import EditGlobal from './views/globals/Edit';
import { requests } from '../api';
import customComponents from './custom-components';

const Routes = () => {
  const [initialized, setInitialized] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    requests.get('/init').then(res => res.json().then((data) => {
      if (data && 'initialized' in data) {
        setInitialized(data.initialized);
      }
    }));
  }, []);

  return (
    <Route
      path={config.routes.admin}
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
                <h1>Forgot Password</h1>
              </Route>

              <Route
                render={() => {
                  if (user) {
                    return (
                      <Switch>
                        <Route
                          path={`${match.url}/media-library`}
                        >
                          <MediaLibrary />
                        </Route>

                        <Route
                          path={`${match.url}/`}
                          exact
                        >
                          <Dashboard />
                        </Route>
                        {config.collections.map((collection) => {
                          return (
                            <Route
                              key={`${collection.slug}-list`}
                              path={`${match.url}/collections/${collection.slug}`}
                              exact
                              render={(routeProps) => {
                                const ListComponent = (customComponents[collection.slug] && customComponents[collection.slug].List) ? customComponents[collection.slug].List : List;
                                return (
                                  <ListComponent
                                    {...routeProps}
                                    collection={collection}
                                  />
                                );
                              }}
                            />
                          );
                        })}
                        {config.collections.map((collection) => {
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
                        {config.collections.map((collection) => {
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
                        <Route path={`${match.url}*`}>
                          <NotFound />
                        </Route>
                      </Switch>
                    );
                  }
                  return <Redirect to={`${match.url}/login`} />;
                }}
              />
            </Switch>
          );
        }

        return null;
      }}
    />
  );
};

export default withRouter(Routes);
