'use client'
import type { ClientUser, SanitizedPermissions, TypedUser } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { usePathname, useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js'
import { useEffectEvent } from '../../hooks/useEffectEvent.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { useConfig } from '../Config/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'

export type UserWithToken<T = ClientUser> = {
  /** seconds until expiration */
  exp: number
  token: string
  user: T
}

export type AuthContext<T = ClientUser> = {
  fetchFullUser: () => Promise<null | TypedUser>
  logOut: () => Promise<boolean>
  permissions?: SanitizedPermissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<ClientUser>
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
  user?: ClientUser | null
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
      routes: { inactivity: logoutInactivityRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
    serverURL,
  } = config

  const { i18n } = useTranslation()
  const { closeAllModals, openModal } = useModal()
  const { startRouteTransition } = useRouteTransition()

  const [user, setUserInMemory] = useState<ClientUser | null>(initialUser)
  const [tokenInMemory, setTokenInMemory] = useState<string>()
  const [tokenExpirationMs, setTokenExpirationMs] = useState<number>()
  const [permissions, setPermissions] = useState<SanitizedPermissions>(initialPermissions)
  const [forceLogoutBufferMs, setForceLogoutBufferMs] = useState<number>(120_000)
  const [fetchedUserOnMount, setFetchedUserOnMount] = useState(false)

  const refreshTokenTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const reminderTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const forceLogOutTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)

  const id = user?.id

  const redirectToInactivityRoute = useCallback(() => {
    startRouteTransition(() =>
      router.replace(
        formatAdminURL({
          adminRoute,
          path: `${logoutInactivityRoute}${window.location.pathname.startsWith(adminRoute) ? `?redirect=${encodeURIComponent(window.location.pathname)}` : ''}`,
        }),
      ),
    )

    closeAllModals()
  }, [router, adminRoute, logoutInactivityRoute, closeAllModals, startRouteTransition])

  const revokeTokenAndExpire = useCallback(() => {
    setUserInMemory(null)
    setTokenInMemory(undefined)
    setTokenExpirationMs(undefined)
    clearTimeout(refreshTokenTimeoutRef.current)
  }, [])

  const setNewUser = useCallback(
    (userResponse: null | UserWithToken) => {
      clearTimeout(reminderTimeoutRef.current)
      clearTimeout(forceLogOutTimeoutRef.current)

      if (userResponse?.user) {
        setUserInMemory(userResponse.user)
        setTokenInMemory(userResponse.token)
        setTokenExpirationMs(userResponse.exp * 1000)

        const expiresInMs = Math.max(
          0,
          Math.min((userResponse.exp ?? 0) * 1000 - Date.now(), maxTimeoutMs),
        )

        if (expiresInMs) {
          const nextForceLogoutBufferMs = Math.min(60_000, expiresInMs / 2)
          setForceLogoutBufferMs(nextForceLogoutBufferMs)

          reminderTimeoutRef.current = setTimeout(
            () => {
              if (autoRefresh) {
                refreshCookieEvent()
              } else {
                openModal(stayLoggedInModalSlug)
              }
            },
            Math.max(expiresInMs - nextForceLogoutBufferMs, 0),
          )

          forceLogOutTimeoutRef.current = setTimeout(() => {
            revokeTokenAndExpire()
            redirectToInactivityRoute()
          }, expiresInMs)
        }
      } else {
        revokeTokenAndExpire()
      }
    },
    [autoRefresh, redirectToInactivityRoute, revokeTokenAndExpire, openModal],
  )

  const refreshCookie = useCallback(
    (forceRefresh?: boolean) => {
      if (!id) {
        return
      }

      const expiresInMs = Math.max(0, (tokenExpirationMs ?? 0) - Date.now())

      if (forceRefresh || (tokenExpirationMs && expiresInMs < forceLogoutBufferMs * 2)) {
        clearTimeout(refreshTokenTimeoutRef.current)
        refreshTokenTimeoutRef.current = setTimeout(async () => {
          try {
            const request = await requests.post(
              `${serverURL}${apiRoute}/${userSlug}/refresh-token?refresh`,
              {
                headers: {
                  'Accept-Language': i18n.language,
                },
              },
            )

            if (request.status === 200) {
              const json: UserWithToken = await request.json()
              setNewUser(json)
            } else {
              setNewUser(null)
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
      i18n.language,
      redirectToInactivityRoute,
      serverURL,
      setNewUser,
      tokenExpirationMs,
      userSlug,
      forceLogoutBufferMs,
      id,
    ],
  )

  const refreshCookieAsync = useCallback(
    async (skipSetUser?: boolean): Promise<ClientUser> => {
      try {
        const request = await requests.post(`${serverURL}${apiRoute}/${userSlug}/refresh-token`, {
          headers: {
            'Accept-Language': i18n.language,
          },
        })

        if (request.status === 200) {
          const json: UserWithToken = await request.json()
          if (!skipSetUser) {
            setNewUser(json)
          }
          return json.user
        }

        if (user) {
          setNewUser(null)
          redirectToInactivityRoute()
        }
      } catch (e) {
        toast.error(`Refreshing token failed: ${e.message}`)
      }
      return null
    },
    [apiRoute, i18n.language, redirectToInactivityRoute, serverURL, setNewUser, userSlug, user],
  )

  const logOut = useCallback(async () => {
    try {
      if (user && user.collection) {
        setNewUser(null)
        await requests.post(`${serverURL}${apiRoute}/${user.collection}/logout`)
      }
    } catch (_) {
      // fail silently and log the user out in state
    }

    return true
  }, [apiRoute, serverURL, setNewUser, user])

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
        const request = await requests.get(`${serverURL}${apiRoute}/access${params}`, {
          headers: {
            'Accept-Language': i18n.language,
          },
        })

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
    [serverURL, apiRoute, i18n],
  )

  const fetchFullUser = React.useCallback(async () => {
    try {
      const request = await requests.get(`${serverURL}${apiRoute}/${userSlug}/me`, {
        credentials: 'include',
        headers: {
          'Accept-Language': i18n.language,
        },
      })

      if (request.status === 200) {
        const json: UserWithToken = await request.json()
        setNewUser(json)
        return json?.user || null
      }
    } catch (e) {
      toast.error(`Fetching user failed: ${e.message}`)
    }

    return null
  }, [serverURL, apiRoute, userSlug, i18n.language, setNewUser])

  const refreshCookieEvent = useEffectEvent(refreshCookie)
  useEffect(() => {
    // when location changes, refresh cookie
    refreshCookieEvent()
  }, [pathname])

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

export const useAuth = <T = ClientUser,>(): AuthContext<T> => use(Context) as AuthContext<T>
