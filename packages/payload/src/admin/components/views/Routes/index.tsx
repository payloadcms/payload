import React, { Fragment, Suspense, lazy, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Redirect, Route, Switch } from 'react-router-dom'

import { requests } from '../../../api'
import { LoadingOverlayToggle } from '../../elements/Loading'
import StayLoggedIn from '../../modals/StayLoggedIn'
import DefaultTemplate from '../../templates/Default'
import { ActionsProvider } from '../../utilities/ActionsProvider'
import { useAuth } from '../../utilities/Auth'
import { useConfig } from '../../utilities/Config'
import { DocumentInfoProvider } from '../../utilities/DocumentInfo'
import { useLocale } from '../../utilities/Locale'
import NotFound from '../NotFound'
import Unauthorized from '../Unauthorized'
import { collectionRoutes } from './collections'
import { customRoutes } from './custom'
import { globalRoutes } from './globals'

// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Dashboard = lazy(() => import('../Dashboard'))
// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const ForgotPassword = lazy(() => import('../ForgotPassword'))
// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Login = lazy(() => import('../Login'))
// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Logout = lazy(() => import('../Logout'))
// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Verify = lazy(() => import('../Verify'))
// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const CreateFirstUser = lazy(() => import('../CreateFirstUser'))
// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const ResetPassword = lazy(() => import('../ResetPassword'))
// @ts-expect-error Just TypeScript being broken // TODO: Open TypeScript issue
const Account = lazy(() => import('../Account'))

export const Routes: React.FC = () => {
  const [initialized, setInitialized] = useState<boolean | null>(null)
  const { permissions, refreshCookie, user } = useAuth()
  const { i18n } = useTranslation()
  const { code: locale } = useLocale()

  const canAccessAdmin = permissions?.canAccessAdmin

  const config = useConfig()

  const {
    admin: { inactivityRoute: logoutInactivityRoute, logoutRoute, user: userSlug },
    collections,
    globals,
    routes,
  } = config

  const isLoadingUser = Boolean(
    typeof user === 'undefined' || (user && typeof canAccessAdmin === 'undefined'),
  )

  const userCollection = collections.find(({ slug }) => slug === userSlug)

  useEffect(() => {
    if (userCollection && !userCollection?.auth?.disableLocalStrategy) {
      const { slug } = userCollection

      requests
        .get(`${routes.api}/${slug}/init`, {
          headers: {
            'Accept-Language': i18n.language,
          },
        })
        .then((res) =>
          res.json().then((data) => {
            if (data && 'initialized' in data) {
              setInitialized(data.initialized)
            }
          }),
        )
    } else {
      setInitialized(true)
    }
  }, [i18n.language, routes, userCollection])

  const [_, redirectAfterLogin] = window.location.pathname
    .replace(/\/+$/, '')
    .split(`${routes.admin}/`)

  return (
    <Suspense fallback={<LoadingOverlayToggle name="route-suspense" show />}>
      <LoadingOverlayToggle name="route-loader" show={isLoadingUser} />
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
            )
          }

          if (initialized === true && !isLoadingUser) {
            return (
              <Switch>
                <Route path={`${match.url}/create-first-user`}>
                  <Redirect to={`${match.url}/`} />
                </Route>
                {customRoutes({
                  canAccessAdmin,
                  config,
                  match,
                  user,
                })}
                <Route path={`${match.url}/login`}>
                  <Login />
                </Route>
                <Route path={`${match.url}${logoutRoute}`}>
                  <Logout />
                </Route>
                <Route path={`${match.url}${logoutInactivityRoute}`}>
                  <Logout inactivity />
                </Route>
                {!userCollection?.auth?.disableLocalStrategy && (
                  <Route path={`${match.url}/forgot`}>
                    <ForgotPassword />
                  </Route>
                )}
                {!userCollection?.auth?.disableLocalStrategy && (
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
                    )
                  }
                  return null
                })}
                <Route>
                  {user ? (
                    <Fragment>
                      {canAccessAdmin && (
                        <ActionsProvider>
                          <DefaultTemplate>
                            <Switch>
                              <Route exact path={`${match.url}/`}>
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
                              {collectionRoutes({
                                collections,
                                match,
                                permissions,
                                user,
                              })}
                              {globalRoutes({
                                globals,
                                locale,
                                match,
                                permissions,
                                user,
                              })}
                              <Route path={`${match.url}*`}>
                                <NotFound />
                              </Route>
                            </Switch>
                          </DefaultTemplate>
                        </ActionsProvider>
                      )}
                      {canAccessAdmin === false && <Unauthorized />}
                    </Fragment>
                  ) : (
                    <Redirect
                      to={`${match.url}/login${
                        window.location.pathname.startsWith(routes.admin) && redirectAfterLogin
                          ? `?redirect=${encodeURIComponent(`/${redirectAfterLogin}`)}`
                          : ''
                      }`}
                    />
                  )}
                </Route>
                <Route path={`${match.url}*`}>
                  <NotFound />
                </Route>
              </Switch>
            )
          }

          return null
        }}
      />
      <StayLoggedIn refreshCookie={refreshCookie} />
    </Suspense>
  )
}
