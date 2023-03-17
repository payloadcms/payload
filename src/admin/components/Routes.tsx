import React, { Suspense, lazy, useState, useEffect } from 'react';
import {
  Route, Switch, withRouter, Redirect,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './utilities/Auth';
import { useConfig } from './utilities/Config';
import List from './views/collections/List';
import DefaultTemplate from './templates/Default';
import { requests } from '../api';
import StayLoggedIn from './modals/StayLoggedIn';
import Versions from './views/Versions';
import Version from './views/Version';
import { DocumentInfoProvider } from './utilities/DocumentInfo';
import { useLocale } from './utilities/Locale';
import { LoadingOverlayToggle } from './elements/Loading';
import { TableColumnsProvider } from './elements/TableColumns';

const Dashboard = lazy(() => import('./views/Dashboard'));
const ForgotPassword = lazy(() => import('./views/ForgotPassword'));
const Login = lazy(() => import('./views/Login'));
const Logout = lazy(() => import('./views/Logout'));
const NotFound = lazy(() => import('./views/NotFound'));
const Verify = lazy(() => import('./views/Verify'));
const CreateFirstUser = lazy(() => import('./views/CreateFirstUser'));
const Edit = lazy(() => import('./views/collections/Edit'));
const EditGlobal = lazy(() => import('./views/Global'));
const ResetPassword = lazy(() => import('./views/ResetPassword'));
const Unauthorized = lazy(() => import('./views/Unauthorized'));
const Account = lazy(() => import('./views/Account'));

const Routes = () => {
  const [initialized, setInitialized] = useState(null);
  const { user, permissions, refreshCookie } = useAuth();
  const { i18n } = useTranslation();
  const locale = useLocale();

  const canAccessAdmin = permissions?.canAccessAdmin;

  const config = useConfig();
  const {
    admin: {
      user: userSlug,
      logoutRoute,
      inactivityRoute: logoutInactivityRoute,
      components: {
        routes: customRoutes,
      } = {},
    },
    routes,
    collections,
    globals,
  } = config;

  const isLoadingUser = Boolean(typeof user === 'undefined' || (user && typeof canAccessAdmin === 'undefined'));
  const userCollection = collections.find(({ slug }) => slug === userSlug);

  useEffect(() => {
    const { slug } = userCollection;

    if (!userCollection.auth.disableLocalStrategy) {
      requests.get(`${routes.api}/${slug}/init`, {
        headers: {
          'Accept-Language': i18n.language,
        },
      }).then((res) => res.json().then((data) => {
        if (data && 'initialized' in data) {
          setInitialized(data.initialized);
        }
      }));
    } else {
      setInitialized(true);
    }
  }, [i18n.language, routes, userCollection]);

  return (
    <Suspense fallback={(
      <LoadingOverlayToggle
        show
        name="route-suspense"
      />
    )}
    >
      <LoadingOverlayToggle
        name="route-loader"
        show={isLoadingUser}
      />
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

          if (initialized === true && !isLoadingUser) {
            return (
              <Switch>
                {Array.isArray(customRoutes) && customRoutes.map(({ path, Component, strict, exact, sensitive }) => (
                  <Route
                    key={`${match.url}${path}`}
                    path={`${match.url}${path}`}
                    strict={strict}
                    exact={exact}
                    sensitive={sensitive}
                  >
                    <Component
                      user={user}
                      canAccessAdmin={canAccessAdmin}
                    />
                  </Route>
                ))}

                <Route path={`${match.url}/login`}>
                  <Login />
                </Route>
                <Route path={`${match.url}${logoutRoute}`}>
                  <Logout />
                </Route>
                <Route path={`${match.url}${logoutInactivityRoute}`}>
                  <Logout inactivity />
                </Route>

                {!userCollection.auth.disableLocalStrategy && (
                  <Route path={`${match.url}/forgot`}>
                    <ForgotPassword />
                  </Route>
                )}

                {!userCollection.auth.disableLocalStrategy && (
                  <Route path={`${match.url}/reset/:token`}>
                    <ResetPassword />
                  </Route>
                )}

                {collections.map((collection) => {
                  if (collection?.auth?.verify && !collection.auth.disableLocalStrategy) {
                    return (
                      <Route
                        key={`${collection.slug}-verify`}
                        path={`${match.url}/${collection.slug}/verify/:token`}
                        exact
                      >
                        <Verify collection={collection} />
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
                                <DocumentInfoProvider
                                  collection={collections.find(({ slug }) => slug === userSlug)}
                                  id={user.id}
                                >
                                  <Account />
                                </DocumentInfoProvider>
                              </Route>

                              {collections.reduce((collectionRoutes, collection) => {
                                const routesToReturn = [
                                  ...collectionRoutes,
                                  <Route
                                    key={`${collection.slug}-list`}
                                    path={`${match.url}/collections/${collection.slug}`}
                                    exact
                                    render={(routeProps) => {
                                      if (permissions?.collections?.[collection.slug]?.read?.permission) {
                                        return (
                                          <List
                                            {...routeProps}
                                            collection={collection}
                                          />
                                        );
                                      }

                                      return <Unauthorized />;
                                    }}
                                  />,
                                  <Route
                                    key={`${collection.slug}-create`}
                                    path={`${match.url}/collections/${collection.slug}/create`}
                                    exact
                                    render={(routeProps) => {
                                      if (permissions?.collections?.[collection.slug]?.create?.permission) {
                                        return (
                                          <DocumentInfoProvider collection={collection}>
                                            <Edit
                                              {...routeProps}
                                              collection={collection}
                                            />
                                          </DocumentInfoProvider>
                                        );
                                      }

                                      return <Unauthorized />;
                                    }}
                                  />,
                                  <Route
                                    key={`${collection.slug}-edit`}
                                    path={`${match.url}/collections/${collection.slug}/:id`}
                                    exact
                                    render={(routeProps) => {
                                      const { match: { params: { id } } } = routeProps;
                                      if (permissions?.collections?.[collection.slug]?.read?.permission) {
                                        return (
                                          <DocumentInfoProvider
                                            key={`${collection.slug}-edit-${id}-${locale}`}
                                            collection={collection}
                                            id={id}
                                          >
                                            <Edit
                                              isEditing
                                              {...routeProps}
                                              collection={collection}
                                            />
                                          </DocumentInfoProvider>
                                        );
                                      }

                                      return <Unauthorized />;
                                    }}
                                  />,
                                ];

                                if (collection.versions) {
                                  routesToReturn.push(
                                    <Route
                                      key={`${collection.slug}-versions`}
                                      path={`${match.url}/collections/${collection.slug}/:id/versions`}
                                      exact
                                      render={(routeProps) => {
                                        if (permissions?.collections?.[collection.slug]?.readVersions?.permission) {
                                          return (
                                            <Versions
                                              {...routeProps}
                                              collection={collection}
                                            />
                                          );
                                        }

                                        return <Unauthorized />;
                                      }}
                                    />,
                                  );

                                  routesToReturn.push(
                                    <Route
                                      key={`${collection.slug}-view-version`}
                                      path={`${match.url}/collections/${collection.slug}/:id/versions/:versionID`}
                                      exact
                                      render={(routeProps) => {
                                        if (permissions?.collections?.[collection.slug]?.readVersions?.permission) {
                                          return (
                                            <Version
                                              {...routeProps}
                                              collection={collection}
                                            />
                                          );
                                        }

                                        return <Unauthorized />;
                                      }}
                                    />,
                                  );
                                }

                                return routesToReturn;
                              }, [])}

                              {globals && globals.reduce((globalRoutes, global) => {
                                const routesToReturn = [
                                  ...globalRoutes,
                                  <Route
                                    key={`${global.slug}`}
                                    path={`${match.url}/globals/${global.slug}`}
                                    exact
                                    render={(routeProps) => {
                                      if (permissions?.globals?.[global.slug]?.read?.permission) {
                                        return (
                                          <DocumentInfoProvider
                                            global={global}
                                            key={`${global.slug}-${locale}`}
                                          >
                                            <EditGlobal
                                              {...routeProps}
                                              global={global}
                                            />
                                          </DocumentInfoProvider>
                                        );
                                      }

                                      return <Unauthorized />;
                                    }}
                                  />,
                                ];

                                if (global.versions) {
                                  routesToReturn.push(
                                    <Route
                                      key={`${global.slug}-versions`}
                                      path={`${match.url}/globals/${global.slug}/versions`}
                                      exact
                                      render={(routeProps) => {
                                        if (permissions?.globals?.[global.slug]?.readVersions?.permission) {
                                          return (
                                            <Versions
                                              {...routeProps}
                                              global={global}
                                            />
                                          );
                                        }

                                        return <Unauthorized />;
                                      }}
                                    />,
                                  );
                                  routesToReturn.push(
                                    <Route
                                      key={`${global.slug}-view-version`}
                                      path={`${match.url}/globals/${global.slug}/versions/:versionID`}
                                      exact
                                      render={(routeProps) => {
                                        if (permissions?.globals?.[global.slug]?.readVersions?.permission) {
                                          return (
                                            <Version
                                              {...routeProps}
                                              global={global}
                                            />
                                          );
                                        }

                                        return <Unauthorized />;
                                      }}
                                    />,
                                  );
                                }
                                return routesToReturn;
                              }, [])}

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

                      return (
                        // user without admin panel access
                        <div />
                      );
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
      <StayLoggedIn refreshCookie={refreshCookie} />
    </Suspense>
  );
};

export default withRouter(Routes);
