'use client'
import type { AuthenticatedUser, SanitizedPermissions } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { AuthSessionResyncOptions, AuthSessionResyncResult } from './sessionSync.js'
import type { AuthContext, UserWithToken } from './types.js'

import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { useConfig } from '../Config/index.js'
import { useRouter } from '../RouterAdapter/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { createAuthSessionRequestCoordinator } from './sessionRequestCoordinator.js'
import { AUTH_SESSION_SYNC_EVENT_TYPES } from './sessionSync.js'
import { useSessionSync } from './useSessionSync.js'
import { useSessionTiming } from './useSessionTiming.js'

export type { AuthContext, UserWithToken } from './types.js'

const Context = createContext({} as AuthContext)

type Props = {
  children: React.ReactNode
  permissions?: SanitizedPermissions
  user?: AuthenticatedUser | null
}

export function AuthProvider({
  children,
  permissions: initialPermissions,
  user: initialUser,
}: Props) {
  const router = useRouter()

  const { config } = useConfig()

  const {
    admin: {
      autoLogin,
      autoRefresh,
      routes: { inactivity: logoutInactivityRoute, login: loginRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
  } = config

  const { i18n } = useTranslation()
  const { closeAllModals, openModal } = useModal()
  const { startRouteTransition } = useRouteTransition()

  const [user, setUserInMemory] = useState<AuthenticatedUser | null>(initialUser)
  const [tokenInMemory, setTokenInMemory] = useState<string>()
  const [tokenExpirationMs, setTokenExpirationMs] = useState<number>()
  const [permissions, setPermissions] = useState<SanitizedPermissions>(initialPermissions)
  const [fetchedUserOnMount, setFetchedUserOnMount] = useState(false)

  const [coordinator] = useState(createAuthSessionRequestCoordinator)
  const userRef = React.useRef<AuthenticatedUser | null>(initialUser)

  const isAuthenticated = Boolean(user)

  const redirectToInactivityRoute = useCallback(() => {
    const baseAdminRoute = formatAdminURL({ adminRoute, path: '' })
    startRouteTransition(() =>
      router.replace(
        formatAdminURL({
          adminRoute,
          path: `${logoutInactivityRoute}${window.location.pathname.startsWith(baseAdminRoute) ? `?redirect=${encodeURIComponent(window.location.pathname)}` : ''}`,
        }),
      ),
    )

    closeAllModals()
  }, [router, adminRoute, logoutInactivityRoute, closeAllModals, startRouteTransition])

  const redirectToLoginRoute = useCallback(() => {
    startRouteTransition(() =>
      router.replace(
        formatAdminURL({
          adminRoute,
          path: loginRoute,
        }),
      ),
    )

    closeAllModals()
  }, [adminRoute, closeAllModals, loginRoute, router, startRouteTransition])

  function onSessionActivityRefresh() {
    void refreshSession({ isActivityRefresh: true })
  }

  function onSessionExpiration(expirationMs: number) {
    sessionSync.publish({
      type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
      expiredTokenAt: expirationMs,
    })
    setNewUser(null)
    redirectToInactivityRoute()
  }

  function onSessionReminder() {
    if (autoRefresh) {
      sessionTiming.refreshCookie()
    } else {
      openModal(stayLoggedInModalSlug)
    }
  }

  const sessionTiming = useSessionTiming({
    isAuthenticated,
    onActivityRefresh: onSessionActivityRefresh,
    onExpire: onSessionExpiration,
    onReminder: onSessionReminder,
  })

  const clearUserInMemory = useCallback(() => {
    userRef.current = null
    setUserInMemory(null)
    setTokenInMemory(undefined)
    setTokenExpirationMs(undefined)
    sessionTiming.clear()
  }, [sessionTiming])

  const applyUserResponse = useCallback(
    (userResponse: null | UserWithToken) => {
      if (userResponse?.user) {
        const nextTokenExpirationMs = userResponse.exp * 1000

        userRef.current = userResponse.user
        setUserInMemory(userResponse.user)
        setTokenInMemory(userResponse.token ?? userResponse.refreshedToken)
        setTokenExpirationMs(nextTokenExpirationMs)
        sessionTiming.applyExpiration(nextTokenExpirationMs)
      } else {
        clearUserInMemory()
      }
    },
    [clearUserInMemory, sessionTiming],
  )

  const setNewUser = useCallback(
    (userResponse: null | UserWithToken) => {
      coordinator.advanceSession()
      applyUserResponse(userResponse)
    },
    [applyUserResponse, coordinator],
  )

  const sessionSync = useSessionSync({
    fetchFullUser: (options) => fetchFullUserResult(options),
    getTokenExpirationMs: sessionTiming.getKnownExpirationMs,
    onSessionExpired: () => {
      setNewUser(null)
      redirectToInactivityRoute()
    },
    onSessionLoggedOut: () => {
      const collection = userRef.current?.collection

      void settleExplicitLogout({ collection })
      redirectToLoginRoute()
    },
    onSessionRefreshed: (session) => {
      if (!coordinator.isLogoutPending()) {
        setNewUser(session)
      }
    },
    onSessionResyncUnauthenticated: () => {
      redirectToInactivityRoute()
    },
  })

  const refreshSession = useCallback(
    ({ isActivityRefresh }: { isActivityRefresh: boolean }): Promise<AuthenticatedUser | null> => {
      return coordinator.refresh(async ({ canCommit, deferInvalidation, hasQueuedRequest }) => {
        if (!canCommit()) {
          return null
        }

        const handledExpiration = sessionTiming.getCurrentExpirationMs()
        const handledUser = userRef.current

        try {
          const request = await requests.post(
            formatAdminURL({
              apiRoute,
              path: `/${userSlug}/refresh-token${isActivityRefresh ? '?refresh' : ''}`,
            }),
            {
              headers: {
                'Accept-Language': i18n.language,
              },
            },
          )

          if (!canCommit()) {
            return null
          }

          if (request.status === 200) {
            const json: UserWithToken = await request.json()

            if (!canCommit()) {
              return null
            }

            coordinator.clearPendingInvalidation()
            applyUserResponse(json)
            sessionSync.publish({
              type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
              session: json,
            })
            return json.user
          }

          if (handledUser) {
            const invalidateSession = () => {
              if (handledExpiration !== undefined) {
                sessionSync.publish({
                  type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
                  expiredTokenAt: handledExpiration,
                })
              }

              applyUserResponse(null)
              redirectToInactivityRoute()
            }

            if (hasQueuedRequest()) {
              deferInvalidation(invalidateSession)
            } else {
              invalidateSession()
            }
          }
        } catch (e) {
          toast.error(`Refreshing token failed: ${e.message}`)
        }

        return null
      })
    },
    [
      apiRoute,
      applyUserResponse,
      coordinator,
      i18n.language,
      redirectToInactivityRoute,
      sessionSync,
      sessionTiming,
      userSlug,
    ],
  )

  const refreshCookieAsync = useCallback(
    (): Promise<AuthenticatedUser | null> => refreshSession({ isActivityRefresh: false }),
    [refreshSession],
  )

  const settleExplicitLogout = useCallback(
    ({ collection }: { collection?: string }): Promise<void> => {
      return coordinator.settleLogout({
        clearSession: () => {
          setNewUser(null)
        },
        request: async () => {
          try {
            if (collection) {
              await requests.post(
                formatAdminURL({
                  apiRoute,
                  path: `/${collection}/logout`,
                }),
              )
            }
          } catch (_) {
            // Explicit logout always clears local state, even if server revocation fails.
          }
        },
      })
    },
    [apiRoute, coordinator, setNewUser],
  )

  const logOut = useCallback(async () => {
    const logoutEvent = { type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT } as const
    const logoutPublication = sessionSync.publish(logoutEvent)
    const collection = userRef.current?.collection

    await settleExplicitLogout({ collection })

    if (logoutPublication?.type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT) {
      sessionSync.publishStorageRefresh(logoutPublication)
    }

    return true
  }, [sessionSync, settleExplicitLogout])

  const refreshPermissions = useCallback(
    async ({ locale }: { locale?: string } = {}) => {
      const params = qs.stringify(
        {
          locale,
        },
        {
          addQueryPrefix: true,
        },
      )

      try {
        const request = await requests.get(
          formatAdminURL({
            apiRoute,
            path: `/access${params}`,
          }),
          {
            headers: {
              'Accept-Language': i18n.language,
            },
          },
        )

        if (request.status === 200) {
          const json: SanitizedPermissions = await request.json()
          setPermissions(json)
        } else {
          throw new Error(`Fetching permissions failed with status code ${request.status}`)
        }
      } catch (e) {
        toast.error(`Refreshing permissions failed: ${e.message}`)
      }
    },
    [apiRoute, i18n],
  )

  const fetchFullUserResult = React.useCallback(
    ({ isCurrent }: Partial<AuthSessionResyncOptions> = {}): Promise<
      AuthSessionResyncResult<AuthenticatedUser>
    > => {
      return coordinator.enqueue(async ({ canCommit }) => {
        const canApplyResult = () => canCommit() && (!isCurrent || isCurrent())

        if (!canApplyResult()) {
          return { status: 'indeterminate' }
        }

        try {
          const request = await requests.get(
            formatAdminURL({
              apiRoute,
              path: `/${userSlug}/me`,
            }),
            {
              credentials: 'include',
              headers: {
                'Accept-Language': i18n.language,
              },
            },
          )

          if (request.status !== 200) {
            return { status: 'indeterminate' }
          }

          const json: null | UserWithToken = await request.json()

          if (!canApplyResult()) {
            return { status: 'indeterminate' }
          }

          if (json?.user) {
            coordinator.clearPendingInvalidation()
            applyUserResponse(json)

            return {
              expirationMs: json.exp * 1000,
              status: 'authenticated',
              user: json.user,
            }
          }

          applyUserResponse(null)

          return { status: 'unauthenticated' }
        } catch (e) {
          toast.error(`Fetching user failed: ${e.message}`)
        }

        return { status: 'indeterminate' }
      })
    },
    [apiRoute, applyUserResponse, coordinator, i18n.language, userSlug],
  )

  const fetchFullUser = React.useCallback(async (): Promise<AuthenticatedUser | null> => {
    const result = await fetchFullUserResult()

    return result.status === 'authenticated' ? result.user : null
  }, [fetchFullUserResult])

  const fetchFullUserEvent = useEffectEvent(fetchFullUser)

  useEffect(() => {
    async function fetchUserOnMount() {
      await fetchFullUserEvent()
      setFetchedUserOnMount(true)
    }

    void fetchUserOnMount()
  }, [])

  useEffect(() => {
    if (!user && autoLogin && !autoLogin.prefillOnly) {
      void fetchFullUserEvent()
    }
  }, [user, autoLogin])

  useEffect(
    () => () => {
      coordinator.advanceSession()
    },
    [coordinator],
  )

  if (!user && !fetchedUserOnMount) {
    return null
  }

  return (
    <Context
      value={{
        fetchFullUser,
        logOut,
        permissions,
        refreshCookie: sessionTiming.refreshCookie,
        refreshCookieAsync,
        refreshPermissions,
        setPermissions,
        setUser: setNewUser,
        token: tokenInMemory,
        tokenExpirationMs,
        user,
      }}
    >
      {children}
    </Context>
  )
}

export const useAuth = <T = AuthenticatedUser,>(): AuthContext<T> => use(Context) as AuthContext<T>
