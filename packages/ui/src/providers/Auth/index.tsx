'use client'
import type { AuthenticatedUser, SanitizedPermissions } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { MarkSessionActivity } from './sessionActivity.js'
import type { AuthSessionResyncOptions, AuthSessionResyncResult } from './sessionSync.js'

import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { useConfig } from '../Config/index.js'
import { useRouter } from '../RouterAdapter/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
} from './sessionActivity.js'
import { AUTH_SESSION_SYNC_EVENT_TYPES, createAuthSessionSync } from './sessionSync.js'

export type UserWithToken<T = AuthenticatedUser> = {
  /** seconds until expiration */
  exp: number
  refreshedToken?: string
  token?: string
  user: T
}

export type AuthContext<T = AuthenticatedUser> = {
  fetchFullUser: () => Promise<null | T>
  logOut: () => Promise<boolean>
  /**
   * These are the permissions for the current user from a global scope.
   *
   * When checking for permissions on document specific level, use the `useDocumentInfo` hook instead.
   *
   * @example
   *
   * ```tsx
   * import { useAuth } from 'payload/ui'
   *
   * const MyComponent: React.FC = () => {
   *   const { permissions } = useAuth()
   *
   *   if (permissions?.collections?.myCollection?.create) {
   *     // user can create documents in 'myCollection'
   *   }
   *
   *   return null
   * }
   * ```
   *
   * with useDocumentInfo:
   *
   * ```tsx
   * import { useDocumentInfo } from 'payload/ui'
   *
   * const MyComponent: React.FC = () => {
   *  const { docPermissions } = useDocumentInfo()
   *  if (docPermissions?.create) {
   *   // user can create this document
   *  }
   *  return null
   * } ```
   */
  permissions?: SanitizedPermissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<null | T>
  refreshPermissions: () => Promise<void>
  setPermissions: (permissions: SanitizedPermissions) => void
  setUser: (user: null | UserWithToken<T>) => void
  strategy?: string
  token?: string
  tokenExpirationMs?: number
  user?: null | T
}

const Context = createContext({} as AuthContext)

const maxTimeoutMs = 2147483647

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
  const [forceLogoutBufferMs, setForceLogoutBufferMs] = useState<number>(120_000)
  const [fetchedUserOnMount, setFetchedUserOnMount] = useState(false)
  const [sessionSyncSourceID] = useState(createSessionSyncSourceID)

  const refreshTokenTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const reminderTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const forceLogOutTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const activityCheckpointTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const lastSessionActivityAtRef = React.useRef<number>(undefined)
  const authRequestQueueRef = React.useRef<Promise<void>>(Promise.resolve())
  const authRequestSequenceRef = React.useRef(0)
  const explicitLogoutSettlementRef = React.useRef<Promise<void>>(undefined)
  const isExplicitLogoutPendingRef = React.useRef(false)
  const knownTokenExpirationMsRef = React.useRef<number>(undefined)
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
  const sessionSyncRef = React.useRef<null | ReturnType<typeof createAuthSessionSync>>(null)
  const tokenExpirationMsRef = React.useRef<number>(undefined)
  const userRef = React.useRef<AuthenticatedUser | null>(initialUser)

  const id = user?.id
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
    tokenExpirationMsRef.current = undefined
    lastSessionActivityAtRef.current = undefined
    clearTimeout(refreshTokenTimeoutRef.current)
    clearTimeout(activityCheckpointTimeoutRef.current)
  }, [])

  const revokeTokenAndExpire = useCallback(() => {
    sessionGenerationRef.current += 1
    clearUserInMemory()
  }, [clearUserInMemory])

  // Handler for reminder timeout - uses useEffectEvent to capture latest autoRefresh value
  const handleReminderTimeout = useEffectEvent(() => {
    if (autoRefresh) {
      refreshCookieEvent()
    } else {
      openModal(stayLoggedInModalSlug)
    }
  })

  const applyUserResponse = useCallback(
    (userResponse: null | UserWithToken) => {
      clearTimeout(reminderTimeoutRef.current)
      clearTimeout(forceLogOutTimeoutRef.current)
      clearTimeout(activityCheckpointTimeoutRef.current)

      if (userResponse?.user) {
        lastSessionActivityAtRef.current = undefined
        clearTimeout(refreshTokenTimeoutRef.current)

        const nextTokenExpirationMs = userResponse.exp * 1000

        userRef.current = userResponse.user
        setUserInMemory(userResponse.user)
        setTokenInMemory(userResponse.token ?? userResponse.refreshedToken)
        setTokenExpirationMs(nextTokenExpirationMs)
        knownTokenExpirationMsRef.current = Math.max(
          knownTokenExpirationMsRef.current ?? 0,
          nextTokenExpirationMs,
        )
        tokenExpirationMsRef.current = nextTokenExpirationMs

        const expiresInMs = Math.max(0, Math.min(nextTokenExpirationMs - Date.now(), maxTimeoutMs))

        if (expiresInMs) {
          const nextForceLogoutBufferMs = Math.min(60_000, expiresInMs / 2)
          setForceLogoutBufferMs(nextForceLogoutBufferMs)

          reminderTimeoutRef.current = setTimeout(
            handleReminderTimeout,
            Math.max(expiresInMs - nextForceLogoutBufferMs, 0),
          )

          const refreshWindowMs = nextForceLogoutBufferMs * 2

          activityCheckpointTimeoutRef.current = setTimeout(
            () => {
              const checkpointAt = Date.now()
              const lastActivityAt = lastSessionActivityAtRef.current
              const hasRecentActivity =
                lastActivityAt !== undefined &&
                lastActivityAt <= checkpointAt &&
                checkpointAt - lastActivityAt <= refreshWindowMs

              if (hasRecentActivity) {
                refreshCookieEvent(true)
              }
            },
            Math.max(expiresInMs - refreshWindowMs, 0),
          )

          forceLogOutTimeoutRef.current = setTimeout(() => {
            if (tokenExpirationMsRef.current !== nextTokenExpirationMs) {
              return
            }

            sessionSyncRef.current?.publish({
              type: AUTH_SESSION_SYNC_EVENT_TYPES.EXPIRED,
              expiredTokenAt: nextTokenExpirationMs,
            })
            revokeTokenAndExpire()
            redirectToInactivityRoute()
          }, expiresInMs)
        }
      } else {
        clearUserInMemory()
      }
    },
    [clearUserInMemory, redirectToInactivityRoute, revokeTokenAndExpire],
  )

  const setNewUser = useCallback(
    (userResponse: null | UserWithToken) => {
      pendingAuthInvalidationRef.current = undefined
      sessionGenerationRef.current += 1
      applyUserResponse(userResponse)
    },
    [applyUserResponse],
  )

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

          const handledExpiration = tokenExpirationMsRef.current
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
              sessionSyncRef.current?.publish({
                type: AUTH_SESSION_SYNC_EVENT_TYPES.REFRESHED,
                session: json,
              })
              return json.user
            }

            if (handledUser) {
              const invalidateSession = () => {
                if (handledExpiration !== undefined) {
                  sessionSyncRef.current?.publish({
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
      userSlug,
    ],
  )

  const refreshCookie = useCallback(
    (forceRefresh?: boolean) => {
      if (!id) {
        return
      }

      const expiresInMs = Math.max(0, (tokenExpirationMs ?? 0) - Date.now())

      if (forceRefresh || (tokenExpirationMs && expiresInMs <= forceLogoutBufferMs * 2)) {
        clearTimeout(refreshTokenTimeoutRef.current)
        refreshTokenTimeoutRef.current = setTimeout(() => {
          void refreshSession({ isActivityRefresh: true })
        }, 1000)
      }
    },
    [forceLogoutBufferMs, id, refreshSession, tokenExpirationMs],
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
    const sessionSync = sessionSyncRef.current
    const logoutEvent = { type: AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT } as const
    const logoutPublication = sessionSync?.publish(logoutEvent)
    const collection = userRef.current?.collection

    await settleExplicitLogout({ collection })

    if (logoutPublication?.type === AUTH_SESSION_SYNC_EVENT_TYPES.LOGGED_OUT) {
      sessionSync?.publishStorageRefresh(logoutPublication)
    }

    return true
  }, [settleExplicitLogout])

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

  const refreshCookieEvent = useEffectEvent(refreshCookie)
  const markActivity = React.useMemo<MarkSessionActivity>(() => {
    if (id === undefined) {
      return () => false
    }

    return createSessionActivityTracker({
      onActivity: (_source, occurredAt) => {
        lastSessionActivityAtRef.current = occurredAt
        refreshCookieEvent()
      },
    })
  }, [id])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    return registerSessionActivityListeners({ markActivity, window })
  }, [isAuthenticated, markActivity])

  const fetchFullUserEvent = useEffectEvent(fetchFullUser)
  const fetchFullUserResultEvent = useEffectEvent(fetchFullUserResult)
  const handleRemoteSessionExpired = useEffectEvent(() => {
    setNewUser(null)
    redirectToInactivityRoute()
  })
  const handleRemoteSessionLoggedOut = useEffectEvent(() => {
    const collection = userRef.current?.collection

    void settleExplicitLogout({ collection })
    redirectToLoginRoute()
  })
  const handleRemoteSessionRefreshed = useEffectEvent((session: UserWithToken) => {
    if (!isExplicitLogoutPendingRef.current) {
      setNewUser(session)
    }
  })
  const handleStorageSessionUnauthenticated = useEffectEvent(() => {
    redirectToInactivityRoute()
  })

  useEffect(() => {
    const sessionSync = createAuthSessionSync({
      fetchFullUser: fetchFullUserResultEvent,
      getTokenExpirationMs: () => knownTokenExpirationMsRef.current,
      onSessionExpired: handleRemoteSessionExpired,
      onSessionLoggedOut: handleRemoteSessionLoggedOut,
      onSessionRefreshed: handleRemoteSessionRefreshed,
      onSessionResyncUnauthenticated: handleStorageSessionUnauthenticated,
      sourceID: sessionSyncSourceID,
    })

    sessionSyncRef.current = sessionSync

    return () => {
      if (sessionSyncRef.current === sessionSync) {
        sessionSyncRef.current = null
      }

      sessionSync.cleanup()
    }
  }, [sessionSyncSourceID])

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
      clearTimeout(refreshTokenTimeoutRef.current)
      clearTimeout(reminderTimeoutRef.current)
      clearTimeout(forceLogOutTimeoutRef.current)
      clearTimeout(activityCheckpointTimeoutRef.current)
      lastSessionActivityAtRef.current = undefined
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
        refreshCookie,
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

function createSessionSyncSourceID(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}
