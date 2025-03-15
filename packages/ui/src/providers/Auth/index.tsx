'use client'
import type { ClientUser, SanitizedPermissions, User } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { usePathname, useRouter } from 'next/navigation.js'
import { formatAdminURL } from 'payload/shared'
import * as qs from 'qs-esm'
import React, { createContext, use, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { useConfig } from '../Config/index.js'
import { useRouteTransition } from '../RouteTransition/index.js'

export type UserWithToken<T = ClientUser> = {
  exp: number
  token: string
  user: T
}

export type AuthContext<T = ClientUser> = {
  fetchFullUser: () => Promise<null | User>
  logOut: () => Promise<boolean>
  permissions?: SanitizedPermissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<ClientUser>
  refreshPermissions: () => Promise<void>
  setPermissions: (permissions: SanitizedPermissions) => void
  setUser: (user: null | UserWithToken<T>) => void
  strategy?: string
  token?: string
  tokenExpiration?: number
  user?: null | T
}

const Context = createContext({} as AuthContext)

const maxTimeoutTime = 2147483647

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
  const [user, setUserInMemory] = useState<ClientUser | null>(initialUser)
  const [tokenInMemory, setTokenInMemory] = useState<string>()
  const [tokenExpiration, setTokenExpiration] = useState<number>()
  const pathname = usePathname()
  const router = useRouter()

  const { config } = useConfig()

  const {
    admin: {
      routes: { inactivity: logoutInactivityRoute },
      user: userSlug,
    },
    routes: { admin: adminRoute, api: apiRoute },
    serverURL,
  } = config

  const [permissions, setPermissions] = useState<SanitizedPermissions>(initialPermissions)

  const { i18n } = useTranslation()
  const { closeAllModals, openModal } = useModal()
  const [lastLocationChange, setLastLocationChange] = useState(0)
  const debouncedLocationChange = useDebounce(lastLocationChange, 10000)
  const refreshTokenTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>(null)
  const { startRouteTransition } = useRouteTransition()

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
    setTokenInMemory(undefined)
    setTokenExpiration(undefined)
    clearTimeout(refreshTokenTimeoutRef.current)
  }, [])

  const setNewUser = useCallback(
    (userResponse: null | UserWithToken) => {
      if (userResponse?.user) {
        setUserInMemory(userResponse.user)
        setTokenInMemory(userResponse.token)
        setTokenExpiration(userResponse.exp)
      } else {
        setUserInMemory(null)
        revokeTokenAndExpire()
      }
    },
    [revokeTokenAndExpire],
  )

  const refreshCookie = useCallback(
    (forceRefresh?: boolean) => {
      const now = Math.round(new Date().getTime() / 1000)
      const remainingTime = (typeof tokenExpiration === 'number' ? tokenExpiration : 0) - now

      if (forceRefresh || (tokenExpiration && remainingTime < 120)) {
        refreshTokenTimeoutRef.current = setTimeout(() => {
          async function refresh() {
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
                const json = await request.json()
                setNewUser(json)
              } else {
                setNewUser(null)
                redirectToInactivityRoute()
              }
            } catch (e) {
              toast.error(e.message)
            }
          }

          void refresh()
        }, 1000)
      }

      return () => {
        clearTimeout(refreshTokenTimeoutRef.current)
      }
    },
    [
      apiRoute,
      i18n.language,
      redirectToInactivityRoute,
      serverURL,
      setNewUser,
      tokenExpiration,
      userSlug,
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
          const json = await request.json()
          if (!skipSetUser) {
            setNewUser(json)
          }
          return json.user
        }

        setNewUser(null)
        redirectToInactivityRoute()
        return null
      } catch (e) {
        toast.error(`Refreshing token failed: ${e.message}`)
        return null
      }
    },
    [apiRoute, i18n.language, redirectToInactivityRoute, serverURL, setNewUser, userSlug],
  )

  const logOut = useCallback(async () => {
    try {
      await requests.post(`${serverURL}${apiRoute}/${user.collection}/logout`)
      setNewUser(null)
      revokeTokenAndExpire()
      return true
    } catch (e) {
      toast.error(`Logging out failed: ${e.message}`)
      return false
    }
  }, [apiRoute, revokeTokenAndExpire, serverURL, setNewUser, user])

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
        const user = null

        setNewUser(json)
        return user
      }
    } catch (e) {
      toast.error(`Fetching user failed: ${e.message}`)
    }

    return null
  }, [serverURL, apiRoute, userSlug, i18n.language, setNewUser])

  // On mount, get user and set
  useEffect(() => {
    void fetchFullUser()
  }, [fetchFullUser])

  // When location changes, refresh cookie
  useEffect(() => {
    if (id) {
      refreshCookie()
    }
  }, [debouncedLocationChange, refreshCookie, id])

  useEffect(() => {
    setLastLocationChange(Date.now())
  }, [pathname])

  useEffect(() => {
    let reminder: ReturnType<typeof setTimeout>
    let forceLogOut: ReturnType<typeof setTimeout>
    const now = Math.round(new Date().getTime() / 1000)
    const remainingTime = typeof tokenExpiration === 'number' ? tokenExpiration - now : 0
    const remindInTimeFromNow = Math.max(Math.min((remainingTime - 60) * 1000, maxTimeoutTime), 0)
    const forceLogOutInTimeFromNow = Math.max(Math.min(remainingTime * 1000, maxTimeoutTime), 0)

    if (!user) {
      clearTimeout(reminder)
      clearTimeout(forceLogOut)
      return
    }

    if (remainingTime > 0) {
      reminder = setTimeout(() => {
        openModal(stayLoggedInModalSlug)
      }, remindInTimeFromNow)

      forceLogOut = setTimeout(() => {
        setNewUser(null)
        redirectToInactivityRoute()
      }, forceLogOutInTimeFromNow)
    }

    return () => {
      if (reminder) {
        clearTimeout(reminder)
      }
      if (forceLogOut) {
        clearTimeout(forceLogOut)
      }
    }
  }, [tokenExpiration, openModal, i18n, setNewUser, user, redirectToInactivityRoute])

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
        user,
      }}
    >
      {children}
    </Context>
  )
}

export const useAuth = <T = ClientUser,>(): AuthContext<T> => use(Context) as AuthContext<T>
