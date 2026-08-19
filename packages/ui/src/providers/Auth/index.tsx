'use client'
import type { ClientUser, SanitizedPermissions } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { usePathname, useRouter, useSearchParams } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { TabSessionReconciliationOptions } from './tabSessionSync/index.js'
import type { AuthContext, AuthSession, UserWithToken } from './types.js'

import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { useConfig } from '../Config/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import { createAuthSessionRequests } from './authSessionRequests.js'
import { TAB_SESSION_EVENT_TYPES } from './tabSessionSync/index.js'
import { useTabSessionSync } from './tabSessionSync/useTabSessionSync.js'
import { useAuthSessionTimers } from './useAuthSessionTimers.js'

export type { AuthContext, AuthSession, UserWithToken } from './types.js'

const Context = createContext({} as AuthContext)

type Props = {
  children: React.ReactNode
  permissions?: SanitizedPermissions
  user?: ClientUser | null
}

type FetchFullUserResult =
  | {
      expirationMs?: number
      status: 'authenticated'
      user: ClientUser
    }
  | {
      status: 'indeterminate'
    }
  | {
      status: 'unauthenticated'
    }

type UserResponse = {
  exp?: number
  refreshedToken?: string
  token?: string
  user?: ClientUser | null
}

export function AuthProvider({
  children,
  permissions: initialPermissions,
  user: initialUser,
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const route = `${pathname}?${searchParams.toString()}`

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

  const [user, setUserInMemory] = useState<ClientUser | null>(initialUser)
  const [tokenInMemory, setTokenInMemory] = useState<string>()
  const [authSession, setAuthSession] = useState<AuthSession>()
  const [permissions, setPermissions] = useState<SanitizedPermissions>(initialPermissions)
  const [fetchedUserOnMount, setFetchedUserOnMount] = useState(false)

  const [authRequests] = useState(createAuthSessionRequests)
  const userRef = React.useRef<ClientUser | null>(initialUser)

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

  function onSessionActivity() {
    setAuthSession((currentAuthSession) => {
      if (!currentAuthSession || currentAuthSession.activityRecorded) {
        return currentAuthSession
      }

      return {
        ...currentAuthSession,
        activityRecorded: true,
      }
    })
  }

  function onSessionActivityRefresh() {
    void refreshSession({ isActivityRefresh: true })
  }

  function onSessionExpiration(expirationMs: number) {
    const collection = userRef.current?.collection

    tabSessionSync.broadcast({
      type: TAB_SESSION_EVENT_TYPES.EXPIRED,
      expiredTokenAt: expirationMs,
    })
    void logOutSession({ collection }).then(redirectToInactivityRoute)
  }

  function onSessionReminder() {
    if (autoRefresh) {
      sessionTimers.scheduleRefresh()
    } else {
      openModal(stayLoggedInModalSlug)
    }
  }

  const sessionTimers = useAuthSessionTimers({
    isAuthenticated,
    onActivity: onSessionActivity,
    onActivityRefresh: onSessionActivityRefresh,
    onExpire: onSessionExpiration,
    onReminder: onSessionReminder,
  })

  useEffect(() => {
    sessionTimers.recordActivity('route')
  }, [route, sessionTimers])

  const clearUserInMemory = useCallback(() => {
    userRef.current = null
    setUserInMemory(null)
    setTokenInMemory(undefined)
    setAuthSession(undefined)
    sessionTimers.clear()
  }, [sessionTimers])

  const setLocalSession = useCallback(
    (session: null | UserResponse) => {
      if (session?.user) {
        const expirationMs =
          typeof session.exp === 'number' && Number.isFinite(session.exp)
            ? session.exp * 1000
            : undefined
        const nextSessionTiming =
          expirationMs !== undefined ? sessionTimers.setExpiration(expirationMs) : undefined

        userRef.current = session.user
        setUserInMemory(session.user)
        setTokenInMemory(session.token ?? session.refreshedToken)

        if (nextSessionTiming) {
          setAuthSession({
            ...nextSessionTiming,
            activityRecorded: false,
          })
        }
      } else {
        clearUserInMemory()
      }
    },
    [clearUserInMemory, sessionTimers],
  )

  const setUser = useCallback(
    (session: null | UserWithToken) => {
      authRequests.discardPendingResults()
      setLocalSession(session)
    },
    [authRequests, setLocalSession],
  )

  const tabSessionSync = useTabSessionSync({
    getTokenExpirationMs: sessionTimers.getCurrentExpirationMs,
    onSessionExpired: () => {
      const collection = userRef.current?.collection

      void logOutSession({ collection }).then(redirectToInactivityRoute)
    },
    onSessionLoggedOut: () => {
      const collection = userRef.current?.collection

      void logOutSession({ collection }).then(redirectToLoginRoute)
    },
    onSessionRefreshed: (session) => {
      if (!authRequests.isLoggingOut()) {
        authRequests.discardPendingResults()
        setLocalSession(session)
      }
    },
    onTabSessionUnauthenticated: () => {
      redirectToInactivityRoute()
    },
    reconcileSession: async (options) => {
      const result = await fetchFullUserResult(options)

      if (result.status === 'authenticated' && result.expirationMs !== undefined) {
        return {
          expirationMs: result.expirationMs,
          status: result.status,
          user: result.user,
        }
      }

      if (result.status === 'unauthenticated') {
        return result
      }

      return { status: 'indeterminate' }
    },
  })

  const refreshSession = useCallback(
    ({ isActivityRefresh }: { isActivityRefresh: boolean }): Promise<ClientUser | null> => {
      return authRequests.refresh(async ({ acceptResult, invalidateWhenIdle, isResultStale }) => {
        if (isResultStale()) {
          return null
        }

        const handledExpiration = sessionTimers.getCurrentExpirationMs()
        const handledUser = userRef.current

        try {
          const refreshStartedAt = Date.now()
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

          if (isResultStale()) {
            return null
          }

          if (request.status === 200) {
            const json: UserWithToken = await request.json()

            if (!acceptResult()) {
              return null
            }

            setLocalSession(json)
            tabSessionSync.broadcast({
              type: TAB_SESSION_EVENT_TYPES.REFRESHED,
              refreshStartedAt,
              session: json,
            })
            return json.user
          }

          if (handledUser) {
            const invalidateSession = () => {
              if (handledExpiration !== undefined) {
                tabSessionSync.broadcast({
                  type: TAB_SESSION_EVENT_TYPES.EXPIRED,
                  expiredTokenAt: handledExpiration,
                })
              }

              setLocalSession(null)
              redirectToInactivityRoute()
            }

            invalidateWhenIdle(invalidateSession)
          }
        } catch (e) {
          toast.error(`Refreshing token failed: ${e.message}`)
        }

        return null
      })
    },
    [
      apiRoute,
      authRequests,
      tabSessionSync,
      i18n.language,
      redirectToInactivityRoute,
      sessionTimers,
      setLocalSession,
      userSlug,
    ],
  )

  const refreshCookieAsync = useCallback(
    (): Promise<ClientUser | null> => refreshSession({ isActivityRefresh: false }),
    [refreshSession],
  )

  const logOutSession = useCallback(
    ({ collection }: { collection?: string }): Promise<void> => {
      return authRequests.logOut({
        clearSession: () => {
          authRequests.discardPendingResults()
          setLocalSession(null)
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
    [apiRoute, authRequests, setLocalSession],
  )

  const logOut = useCallback(async () => {
    const logoutEvent = { type: TAB_SESSION_EVENT_TYPES.LOGGED_OUT } as const
    const logoutPublication = tabSessionSync.broadcast(logoutEvent)
    const collection = userRef.current?.collection

    await logOutSession({ collection })

    if (logoutPublication?.type === TAB_SESSION_EVENT_TYPES.LOGGED_OUT) {
      tabSessionSync.broadcastLogoutSettlement(logoutPublication)
    }

    return true
  }, [tabSessionSync, logOutSession])

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
    ({
      isTabSessionEventStale,
    }: Partial<TabSessionReconciliationOptions> = {}): Promise<FetchFullUserResult> => {
      return authRequests.queue(async ({ acceptResult, isResultStale }) => {
        const isResponseStale = () => isResultStale() || Boolean(isTabSessionEventStale?.())

        if (isResponseStale()) {
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

          const json: null | UserResponse = await request.json()

          if (isResponseStale()) {
            return { status: 'indeterminate' }
          }

          if (json?.user) {
            if (!acceptResult()) {
              return { status: 'indeterminate' }
            }

            setLocalSession(json)

            return {
              expirationMs:
                typeof json.exp === 'number' && Number.isFinite(json.exp)
                  ? json.exp * 1000
                  : sessionTimers.getCurrentExpirationMs(),
              status: 'authenticated',
              user: json.user,
            }
          }

          setLocalSession(null)

          return { status: 'unauthenticated' }
        } catch (e) {
          toast.error(`Fetching user failed: ${e.message}`)
        }

        return { status: 'indeterminate' }
      })
    },
    [apiRoute, authRequests, i18n.language, sessionTimers, setLocalSession, userSlug],
  )

  const fetchFullUser = React.useCallback(async (): Promise<ClientUser | null> => {
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
      authRequests.discardPendingResults()
    },
    [authRequests],
  )

  if (!user && !fetchedUserOnMount) {
    return null
  }

  return (
    <Context
      value={{
        authSession,
        fetchFullUser,
        logOut,
        permissions,
        refreshCookie: sessionTimers.scheduleRefresh,
        refreshCookieAsync,
        refreshPermissions,
        setPermissions,
        setUser,
        token: tokenInMemory,
        user,
      }}
    >
      {children}
    </Context>
  )
}

export const useAuth = <T = ClientUser,>(): AuthContext<T> => use(Context) as AuthContext<T>
