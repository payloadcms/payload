import React, { useState, useEffect, Fragment } from 'react';
import {
  Route, Switch, withRouter, Redirect,
} from 'react-router-dom';
import customComponents from 'payload-custom-components';
import getSanitizedConfig from '../config/getSanitizedConfig';
import { useUser } from './data/User';
import Dashboard from './views/Dashboard';
import Login from './views/Login';
import Logout from './views/Logout';
import NotFound from './views/NotFound';
import CreateFirstUser from './views/CreateFirstUser';
import MediaLibrary from './views/MediaLibrary';
import Edit from './views/collections/Edit';
import List from './views/collections/List';
import EditGlobal from './views/globals/Edit';
import { requests } from '../api';

const config = getSanitizedConfig();

const RenderCollectionRoutes = ({ match }) => {
  const collectionRoutes = config?.collections.reduce((routesToRender, collection) => {
    const ListComponent = customComponents?.collections?.[collection.slug]?.views?.List || List;
    routesToRender.push({
      path: `${match.url}/collections/${collection.slug}`,
      component: ListComponent,
      componentProps: {
        collection,
      },
    });

    routesToRender.push({
      path: `${match.url}/collections/${collection.slug}/create`,
      component: Edit,
    });

    routesToRender.push({
      path: `${match.url}/collections/${collection.slug}/:id`,
      component: Edit,
      componentProps: {
        isEditing: true,
        collection,
      },
    });

    return routesToRender;
  }, []);

  return collectionRoutes.map((route, index) => {
    const ComponentToRender = route.component;

    return (
      <Route
        key={index}
        path={route.path}
        exact
        render={(routeProps) => {
          return (
            <ComponentToRender
              {...routeProps}
              {...route.componentProps}
            />
          );
        }}
      />
    );
  });
};

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

                        <RenderCollectionRoutes match={match} />

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
