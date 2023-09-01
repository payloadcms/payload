import React, { Fragment, Suspense, lazy, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect, Route, Switch } from 'react-router-dom';

import { requests } from '../api';
import { LoadingOverlayToggle } from './elements/Loading';
import StayLoggedIn from './modals/StayLoggedIn';
import DefaultTemplate from './templates/Default';
import { useAuth } from './utilities/Auth';
import { useConfig } from './utilities/Config';
import { DocumentInfoProvider } from './utilities/DocumentInfo';
import { useLocale } from './utilities/Locale';
import Version from './views/Version';
import Versions from './views/Versions';
import List from './views/collections/List';

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

const Routes: React.FC = () => {
  const [initialized, setInitialized] = useState(null);
  const { permissions, refreshCookie, user } = useAuth();
  const { i18n } = useTranslation();
  const { code: locale } = useLocale();

  const canAccessAdmin = permissions?.canAccessAdmin;

  const config = useConfig();

  const {
    admin: {
      components: {
        routes: customRoutes,
      } = {},
      inactivityRoute: logoutInactivityRoute,
      logoutRoute,
      user: userSlug,
    },
    collections,
    globals,
    routes,
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
        name="route-suspense"
        show
      />
    )}
    >
      <LoadingOverlayToggle
        name="route-loader"
        show={isLoadingUser}
      />
      <Route
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
                {Array.isArray(customRoutes) && customRoutes.map(({ Component, exact, path, sensitive, strict }) => (
                  <Route
                    exact={exact}
                    key={`${match.url}${path}`}
                    path={`${match.url}${path}`}
                    sensitive={sensitive}
                    strict={strict}
                  >
                    <Component
                      canAccessAdmin={canAccessAdmin}
                      user={user}
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
                        exact
                        key={`${collection.slug}-verify`}
                        path={`${match.url}/${collection.slug}/verify/:token`}
                      >
                        <Verify collection={collection} />
                      </Route>
                    );
                  }
                  return null;
                })}

                <Route>
                  {user ? (
                    <Fragment>
                      {canAccessAdmin && (
                        <DefaultTemplate>
                          <Switch>
                            <Route
                              exact
                              path={`${match.url}/`}
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
                            {collections
                              .filter(({ admin: { hidden } }) => !(typeof hidden === 'function' ? hidden({ user }) : hidden))
                              .reduce((collectionRoutes, collection) => {
                                const routesToReturn = [
                                  ...collectionRoutes,
                                  <Route
                                    exact
                                    key={`${collection.slug}-list`}
                                    path={`${match.url}/collections/${collection.slug}`}
                                  >
                                    {permissions?.collections?.[collection.slug]?.read?.permission
                                      ? <List collection={collection} />
                                      : <Unauthorized />}
                                  </Route>,
                                  <Route
                                    exact
                                    key={`${collection.slug}-create`}
                                    path={`${match.url}/collections/${collection.slug}/create`}
                                  >
                                    {permissions?.collections?.[collection.slug]?.create?.permission ? (
                                      <DocumentInfoProvider
                                        collection={collection}
                                        idFromParams
                                      >
                                        <Edit collection={collection} />
                                      </DocumentInfoProvider>
                                    ) : (
                                      <Unauthorized />
                                    )}
                                  </Route>,
                                  <Route
                                    exact
                                    key={`${collection.slug}-edit`}
                                    path={`${match.url}/collections/${collection.slug}/:id`}
                                  >
                                    {permissions?.collections?.[collection.slug]?.read?.permission ? (
                                      <DocumentInfoProvider
                                        collection={collection}
                                        idFromParams
                                      >
                                        <Edit
                                          collection={collection}
                                          isEditing
                                        />
                                      </DocumentInfoProvider>
                                    ) : <Unauthorized />}
                                  </Route>,
                                ];

                                if (collection.versions) {
                                  routesToReturn.push(
                                    <Route
                                      exact
                                      key={`${collection.slug}-versions`}
                                      path={`${match.url}/collections/${collection.slug}/:id/versions`}
                                    >
                                      {permissions?.collections?.[collection.slug]?.readVersions?.permission ? (
                                        <Versions collection={collection} />
                                      ) : <Unauthorized />}
                                    </Route>,
                                  );

                                  routesToReturn.push(
                                    <Route
                                      exact
                                      key={`${collection.slug}-view-version`}
                                      path={`${match.url}/collections/${collection.slug}/:id/versions/:versionID`}
                                    >
                                      {permissions?.collections?.[collection.slug]?.readVersions?.permission ? (
                                        <DocumentInfoProvider
                                          collection={collection}
                                          idFromParams
                                        >
                                          <Version collection={collection} />
                                        </DocumentInfoProvider>
                                      ) : <Unauthorized />}
                                    </Route>,
                                  );
                                }

                                return routesToReturn;
                              }, [])}
                            {globals && globals
                              .filter(({ admin: { hidden } }) => !(typeof hidden === 'function' ? hidden({ user }) : hidden))
                              .reduce((globalRoutes, global) => {
                                const routesToReturn = [
                                  ...globalRoutes,
                                  <Route
                                    exact
                                    key={global.slug}
                                    path={`${match.url}/globals/${global.slug}`}
                                  >
                                    {permissions?.globals?.[global.slug]?.read?.permission ? (
                                      <DocumentInfoProvider
                                        global={global}
                                        idFromParams
                                        key={`${global.slug}-${locale}`}
                                      >
                                        <EditGlobal global={global} />
                                      </DocumentInfoProvider>
                                    ) : <Unauthorized />}
                                  </Route>,
                                ];

                                if (global.versions) {
                                  routesToReturn.push(
                                    <Route
                                      exact
                                      key={`${global.slug}-versions`}
                                      path={`${match.url}/globals/${global.slug}/versions`}
                                    >
                                      {permissions?.globals?.[global.slug]?.readVersions?.permission
                                        ? <Versions global={global} />
                                        : <Unauthorized />}
                                    </Route>,
                                  );

                                  routesToReturn.push(
                                    <Route
                                      exact
                                      key={`${global.slug}-view-version`}
                                      path={`${match.url}/globals/${global.slug}/versions/:versionID`}
                                    >
                                      {permissions?.globals?.[global.slug]?.readVersions?.permission ? (
                                        <Version global={global} />
                                      ) : <Unauthorized />}
                                    </Route>,
                                  );
                                }

                                return routesToReturn;
                              }, [])}

                            <Route path={`${match.url}*`}>
                              <NotFound />
                            </Route>
                          </Switch>
                        </DefaultTemplate>
                      )}
                      {canAccessAdmin === false && (
                        <Unauthorized />
                      )}
                    </Fragment>
                  ) : <Redirect to={`${match.url}/login${window.location.pathname.startsWith(routes.admin) ? `?redirect=${encodeURIComponent(window.location.pathname.replace(routes.admin, ''))}` : ''}`} />}
                </Route>
                <Route path={`${match.url}*`}>
                  <NotFound />
                </Route>
              </Switch>
            );
          }

          return null;
        }}
        path={routes.admin}
      />
      <StayLoggedIn refreshCookie={refreshCookie} />
    </Suspense>
  );
};

export default Routes;
