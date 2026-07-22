'use client'
import type { AuthenticatedUser, SanitizedPermissions } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import type { MarkSessionActivity } from './sessionActivity.js'

import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { useConfig } from '../Config/index.js'
import { usePathname, useRouter } from '../RouterAdapter/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'
import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
} from './sessionActivity.js'
import { createAuthSessionSync } from './sessionSync.js'

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
  const pathname = usePathname()
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
  const knownTokenExpirationMsRef = React.useRef<number>(undefined)
  const sessionGenerationRef = React.useRef(0)
  const sessionSyncRef = React.useRef<null | ReturnType<typeof createAuthSessionSync>>(null)
  const tokenExpirationMsRef = React.useRef<number>(undefined)

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
    setUserInMemory(null)
    setTokenInMemory(undefined)
    setTokenExpirationMs(undefined)
    tokenExpirationMsRef.current = undefined
    clearTimeout(refreshTokenTimeoutRef.current)
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

      if (userResponse?.user) {
        const nextTokenExpirationMs = userResponse.exp * 1000

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

          forceLogOutTimeoutRef.current = setTimeout(() => {
            if (tokenExpirationMsRef.current !== nextTokenExpirationMs) {
              return
            }

            sessionSyncRef.current?.publish({
              type: 'session-expired',
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
      sessionGenerationRef.current += 1
      applyUserResponse(userResponse)
    },
    [applyUserResponse],
  )

  const refreshCookie = useCallback(
    (forceRefresh?: boolean) => {
      if (!id) {
        return
      }

      const expiresInMs = Math.max(0, (tokenExpirationMs ?? 0) - Date.now())

      if (forceRefresh || (tokenExpirationMs && expiresInMs < forceLogoutBufferMs * 2)) {
        const handledExpiration = tokenExpirationMsRef.current
        const requestGeneration = sessionGenerationRef.current

        clearTimeout(refreshTokenTimeoutRef.current)
        refreshTokenTimeoutRef.current = setTimeout(async () => {
          try {
            const request = await requests.post(
              formatAdminURL({
                apiRoute,
                path: `/${userSlug}/refresh-token?refresh`,
              }),
              {
                headers: {
                  'Accept-Language': i18n.language,
                },
              },
            )

            if (request.status === 200) {
              const json: UserWithToken = await request.json()

              if (sessionGenerationRef.current !== requestGeneration) {
                return
              }

              applyUserResponse(json)
              sessionSyncRef.current?.publish({ type: 'session-refreshed', session: json })
            } else {
              if (sessionGenerationRef.current !== requestGeneration) {
                return
              }

              if (handledExpiration !== undefined) {
                sessionSyncRef.current?.publish({
                  type: 'session-expired',
                  expiredTokenAt: handledExpiration,
                })
              }

              applyUserResponse(null)
              redirectToInactivityRoute()
            }
          } catch (e) {
            toast.error(e.message)
          }
        }, 1000)
      }
    },
    [
      apiRoute,
      applyUserResponse,
      i18n.language,
      redirectToInactivityRoute,
      tokenExpirationMs,
      userSlug,
      forceLogoutBufferMs,
      id,
    ],
  )

  const refreshCookieAsync = useCallback(
    async (skipSetUser?: boolean): Promise<AuthenticatedUser | null> => {
      const handledExpiration = tokenExpirationMsRef.current
      const requestGeneration = sessionGenerationRef.current

      try {
        const request = await requests.post(
          formatAdminURL({
            apiRoute,
            path: `/${userSlug}/refresh-token`,
          }),
          {
            headers: {
              'Accept-Language': i18n.language,
            },
          },
        )

        if (request.status === 200) {
          const json: UserWithToken = await request.json()

          if (sessionGenerationRef.current !== requestGeneration) {
            return null
          }

          if (!skipSetUser) {
            applyUserResponse(json)
          }
          sessionSyncRef.current?.publish({ type: 'session-refreshed', session: json })
          return json.user
        }

        if (user) {
          if (sessionGenerationRef.current !== requestGeneration) {
            return null
          }

          if (handledExpiration !== undefined) {
            sessionSyncRef.current?.publish({
              type: 'session-expired',
              expiredTokenAt: handledExpiration,
            })
          }

          applyUserResponse(null)
          redirectToInactivityRoute()
        }
      } catch (e) {
        toast.error(`Refreshing token failed: ${e.message}`)
      }
      return null
    },
    [apiRoute, applyUserResponse, i18n.language, redirectToInactivityRoute, userSlug, user],
  )

  const logOut = useCallback(async () => {
    const sessionSync = sessionSyncRef.current

    sessionSync?.publish({ type: 'session-logged-out' })

    try {
      if (user && user.collection) {
        setNewUser(null)
        await requests.post(
          formatAdminURL({
            apiRoute,
            path: `/${user.collection}/logout`,
          }),
        )
      }
    } catch (_) {
      // fail silently and log the user out in state
    } finally {
      sessionSync?.publishStorageRefresh()
    }

    return true
  }, [apiRoute, setNewUser, user])

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

  const fetchFullUser = React.useCallback(async () => {
    const requestGeneration = sessionGenerationRef.current

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

      if (request.status === 200) {
        const json: UserWithToken = await request.json()

        if (sessionGenerationRef.current !== requestGeneration) {
          return null
        }

        applyUserResponse(json)
        return json?.user || null
      }

      if (sessionGenerationRef.current !== requestGeneration) {
        return null
      }

      applyUserResponse(null)
    } catch (e) {
      toast.error(`Fetching user failed: ${e.message}`)
    }

    return null
  }, [apiRoute, applyUserResponse, userSlug, i18n.language])

  const refreshCookieEvent = useEffectEvent(refreshCookie)
  const markActivity = React.useMemo<MarkSessionActivity>(() => {
    if (id === undefined) {
      return () => false
    }

    return createSessionActivityTracker({
      onActivity: () => refreshCookieEvent(),
    })
  }, [id])

  useEffect(() => {
    markActivity('route')
  }, [pathname, markActivity])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    return registerSessionActivityListeners({ document, markActivity, window })
  }, [isAuthenticated, markActivity])

  const fetchFullUserEvent = useEffectEvent(fetchFullUser)
  const handleRemoteSessionExpired = useEffectEvent(() => {
    setNewUser(null)
    redirectToInactivityRoute()
  })
  const handleRemoteSessionLoggedOut = useEffectEvent(() => {
    setNewUser(null)
    redirectToLoginRoute()
  })
  const handleRemoteSessionRefreshed = useEffectEvent((session: UserWithToken) => {
    setNewUser(session)
  })

  useEffect(() => {
    const sessionSync = createAuthSessionSync({
      fetchFullUser: fetchFullUserEvent,
      getTokenExpirationMs: () => knownTokenExpirationMsRef.current,
      onSessionExpired: handleRemoteSessionExpired,
      onSessionLoggedOut: handleRemoteSessionLoggedOut,
      onSessionRefreshed: handleRemoteSessionRefreshed,
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
      clearTimeout(refreshTokenTimeoutRef.current)
      clearTimeout(reminderTimeoutRef.current)
      clearTimeout(forceLogOutTimeoutRef.current)
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
