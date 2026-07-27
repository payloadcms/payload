'use client'
import type { AuthenticatedUser, SanitizedPermissions } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { AuthSessionResyncOptions, AuthSessionResyncResult } from './sessionSync.js'
import type { AuthContext, UserWithToken } from './types.js'
import type { SessionTimingController } from './useSessionTiming.js'

import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { useConfig } from '../Config/index.js'
import { useRouter } from '../RouterAdapter/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
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

  const authRequestQueueRef = React.useRef<Promise<void>>(Promise.resolve())
  const authRequestSequenceRef = React.useRef(0)
  const explicitLogoutSettlementRef = React.useRef<Promise<void>>(undefined)
  const isExplicitLogoutPendingRef = React.useRef(false)
  const pendingAuthInvalidationRef = React.useRef<
    | {
        generation: number
        run: () => void
      }
    | undefined
  >(undefined)
  const refreshRequestRef = React.useRef<
    | {
        generation: number
        promise: Promise<AuthenticatedUser | null>
      }
    | undefined
  >(undefined)
  const sessionGenerationRef = React.useRef(0)
  const sessionTimingRef = React.useRef<SessionTimingController>(undefined)
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

  const clearUserInMemory = useCallback(() => {
    userRef.current = null
    setUserInMemory(null)
    setTokenInMemory(undefined)
    setTokenExpirationMs(undefined)
    sessionTimingRef.current?.clear()
  }, [])

  const revokeTokenAndExpire = useCallback(() => {
    sessionGenerationRef.current += 1
    clearUserInMemory()
  }, [clearUserInMemory])

  const applyUserResponse = useCallback(
    (userResponse: null | UserWithToken) => {
      if (userResponse?.user) {
        const nextTokenExpirationMs = userResponse.exp * 1000

        userRef.current = userResponse.user
        setUserInMemory(userResponse.user)
        setTokenInMemory(userResponse.token ?? userResponse.refreshedToken)
        setTokenExpirationMs(nextTokenExpirationMs)
        sessionTimingRef.current?.applyExpiration(nextTokenExpirationMs)
      } else {
        clearUserInMemory()
      }
    },
    [clearUserInMemory],
  )

  const setNewUser = useCallback(
    (userResponse: null | UserWithToken) => {
      pendingAuthInvalidationRef.current = undefined
      sessionGenerationRef.current += 1
      applyUserResponse(userResponse)
    },
    [applyUserResponse],
  )

  const sessionSync = useSessionSync({
    fetchFullUser: (options) => fetchFullUserResult(options),
    getTokenExpirationMs: () => sessionTimingRef.current?.getKnownExpirationMs(),
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
      if (!isExplicitLogoutPendingRef.current) {
        setNewUser(session)
      }
    },
    onSessionResyncUnauthenticated: () => {
      redirectToInactivityRoute()
    },
  })

  const enqueueAuthRequest = useCallback(
    <Result,>(
      request: ({ hasQueuedRequest }: { hasQueuedRequest: () => boolean }) => Promise<Result>,
    ): Promise<Result> => {
      const requestSequence = ++authRequestSequenceRef.current
      const runRequest = async (): Promise<Result> => {
        const result = await request({
          hasQueuedRequest: () => requestSequence < authRequestSequenceRef.current,
        })

        if (requestSequence === authRequestSequenceRef.current) {
          const pendingAuthInvalidation = pendingAuthInvalidationRef.current

          pendingAuthInvalidationRef.current = undefined

          if (pendingAuthInvalidation?.generation === sessionGenerationRef.current) {
            pendingAuthInvalidation.run()
          }
        }

        return result
      }
      const queuedRequest = authRequestQueueRef.current.then(runRequest, runRequest)

      authRequestQueueRef.current = queuedRequest.then(
        () => undefined,
        () => undefined,
      )

      return queuedRequest
    },
    [],
  )

  const refreshSession = useCallback(
    ({ isActivityRefresh }: { isActivityRefresh: boolean }): Promise<AuthenticatedUser | null> => {
      const requestGeneration = sessionGenerationRef.current
      const activeRequest = refreshRequestRef.current

      if (isExplicitLogoutPendingRef.current) {
        return Promise.resolve(null)
      }

      if (activeRequest?.generation === requestGeneration) {
        return activeRequest.promise
      }

      const refreshPromise = enqueueAuthRequest(
        async ({ hasQueuedRequest }): Promise<AuthenticatedUser | null> => {
          const canCommit = () =>
            sessionGenerationRef.current === requestGeneration &&
            !isExplicitLogoutPendingRef.current

          if (!canCommit()) {
            return null
          }

          const handledExpiration = sessionTimingRef.current?.getCurrentExpirationMs()
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

              pendingAuthInvalidationRef.current = undefined
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
                pendingAuthInvalidationRef.current = {
                  generation: requestGeneration,
                  run: invalidateSession,
                }
              } else {
                invalidateSession()
              }
            }
          } catch (e) {
            toast.error(`Refreshing token failed: ${e.message}`)
          }

          return null
        },
      )

      refreshRequestRef.current = { generation: requestGeneration, promise: refreshPromise }
      void refreshPromise.finally(() => {
        if (refreshRequestRef.current?.promise === refreshPromise) {
          refreshRequestRef.current = undefined
        }
      })

      return refreshPromise
    },
    [
      apiRoute,
      applyUserResponse,
      enqueueAuthRequest,
      i18n.language,
      redirectToInactivityRoute,
      sessionSync,
      userSlug,
    ],
  )

  const refreshCookieAsync = useCallback(
    (): Promise<AuthenticatedUser | null> => refreshSession({ isActivityRefresh: false }),
    [refreshSession],
  )

  const settleExplicitLogout = useCallback(
    ({ collection }: { collection?: string }): Promise<void> => {
      const activeSettlement = explicitLogoutSettlementRef.current

      if (activeSettlement !== undefined) {
        return activeSettlement
      }

      isExplicitLogoutPendingRef.current = true
      setNewUser(null)

      const settlement = enqueueAuthRequest(async () => {
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
        } finally {
          isExplicitLogoutPendingRef.current = false
        }
      })

      explicitLogoutSettlementRef.current = settlement
      void settlement.finally(() => {
        if (explicitLogoutSettlementRef.current === settlement) {
          explicitLogoutSettlementRef.current = undefined
        }
      })

      return settlement
    },
    [apiRoute, enqueueAuthRequest, setNewUser],
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
      const requestGeneration = sessionGenerationRef.current
      const canCommit = () =>
        sessionGenerationRef.current === requestGeneration &&
        !isExplicitLogoutPendingRef.current &&
        (!isCurrent || isCurrent())

      return enqueueAuthRequest(async () => {
        if (!canCommit()) {
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

          if (!canCommit()) {
            return { status: 'indeterminate' }
          }

          if (json?.user) {
            pendingAuthInvalidationRef.current = undefined
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
    [apiRoute, applyUserResponse, enqueueAuthRequest, i18n.language, userSlug],
  )

  const fetchFullUser = React.useCallback(async (): Promise<AuthenticatedUser | null> => {
    const result = await fetchFullUserResult()

    return result.status === 'authenticated' ? result.user : null
  }, [fetchFullUserResult])

  const handleSessionExpiration = useCallback(
    (expirationMs: number) => {
      sessionSync.publish({
        type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
        expiredTokenAt: expirationMs,
      })
      revokeTokenAndExpire()
      redirectToInactivityRoute()
    },
    [redirectToInactivityRoute, revokeTokenAndExpire, sessionSync],
  )
  const sessionTiming = useSessionTiming({
    isAuthenticated,
    onActivityRefresh: () => {
      void refreshSession({ isActivityRefresh: true })
    },
    onExpire: handleSessionExpiration,
    onReminder: () => {
      if (autoRefresh) {
        sessionTimingRef.current?.refreshCookie()
      } else {
        openModal(stayLoggedInModalSlug)
      }
    },
  })
  sessionTimingRef.current = sessionTiming

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
      // remove all timeouts on unmount
      sessionGenerationRef.current += 1
      pendingAuthInvalidationRef.current = undefined
    },
    [],
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
