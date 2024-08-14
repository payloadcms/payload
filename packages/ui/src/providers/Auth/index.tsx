'use client'
import type { ClientUser, MeOperationResult, Permissions } from 'payload'

import { useModal } from '@faceless-ui/modal'
import { usePathname, useRouter } from 'next/navigation.js'
import * as qs from 'qs-esm'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { stayLoggedInModalSlug } from '../../elements/StayLoggedIn/index.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { useTranslation } from '../../providers/Translation/index.js'
import { requests } from '../../utilities/api.js'
import { formatAdminURL } from '../../utilities/formatAdminURL.js'
import { useConfig } from '../Config/index.js'

export type AuthContext<T = ClientUser> = {
  fetchFullUser: () => Promise<void>
  logOut: () => Promise<void>
  permissions?: Permissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<ClientUser>
  refreshPermissions: () => Promise<void>
  setPermissions: (permissions: Permissions) => void
  setUser: (user: T) => void
  strategy?: string
  token?: string
  tokenExpiration?: number
  user?: T | null
}

const Context = createContext({} as AuthContext)

const maxTimeoutTime = 2147483647

type Props = {
  children: React.ReactNode
  permissions?: Permissions
  user?: ClientUser | null
}
export function AuthProvider({
  children,
  permissions: initialPermissions,
  user: initialUser,
}: Props) {
  const [user, setUser] = useState<ClientUser | null>(initialUser)
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

  const [permissions, setPermissions] = useState<Permissions>(initialPermissions)

  const { i18n } = useTranslation()
  const { closeAllModals, openModal } = useModal()
  const [lastLocationChange, setLastLocationChange] = useState(0)
  const debouncedLocationChange = useDebounce(lastLocationChange, 10000)

  const id = user?.id

  const redirectToInactivityRoute = useCallback(() => {
    if (window.location.pathname.startsWith(adminRoute)) {
      const redirectParam = `?redirect=${encodeURIComponent(window.location.pathname)}`
      router.replace(
        formatAdminURL({
          adminRoute,
          path: `${logoutInactivityRoute}${redirectParam}`,
        }),
      )
    } else {
      router.replace(
        formatAdminURL({
          adminRoute,
          path: logoutInactivityRoute,
        }),
      )
    }
    closeAllModals()
  }, [router, adminRoute, logoutInactivityRoute, closeAllModals])

  const revokeTokenAndExpire = useCallback(() => {
    setTokenInMemory(undefined)
    setTokenExpiration(undefined)
  }, [])

  const setTokenAndExpiration = useCallback(
    (json) => {
      const token = json?.token || json?.refreshedToken
      if (token && json?.exp) {
        setTokenInMemory(token)
        setTokenExpiration(json.exp)
      } else {
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
        setTimeout(() => {
          async function refresh() {
            try {
              const request = await requests.post(
                `${serverURL}${apiRoute}/${userSlug}/refresh-token`,
                {
                  headers: {
                    'Accept-Language': i18n.language,
                  },
                },
              )

              if (request.status === 200) {
                const json = await request.json()
                setUser(json.user)

                setTokenAndExpiration(json)
              } else {
                setUser(null)
                redirectToInactivityRoute()
              }
            } catch (e) {
              toast.error(e.message)
            }
          }

          void refresh()
        }, 1000)
      }
    },
    [
      tokenExpiration,
      serverURL,
      apiRoute,
      userSlug,
      i18n,
      redirectToInactivityRoute,
      setTokenAndExpiration,
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
            setUser(json.user)
            setTokenAndExpiration(json)
          }
          return json.user
        }

        setUser(null)
        redirectToInactivityRoute()
        return null
      } catch (e) {
        toast.error(`Refreshing token failed: ${e.message}`)
        return null
      }
    },
    [serverURL, apiRoute, userSlug, i18n, redirectToInactivityRoute, setTokenAndExpiration],
  )

  const logOut = useCallback(async () => {
    setUser(null)
    revokeTokenAndExpire()
    try {
      await requests.post(`${serverURL}${apiRoute}/${userSlug}/logout`)
    } catch (e) {
      toast.error(`Logging out failed: ${e.message}`)
    }
  }, [serverURL, apiRoute, userSlug, revokeTokenAndExpire])

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
          const json: Permissions = await request.json()
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
        headers: {
          'Accept-Language': i18n.language,
        },
      })

      if (request.status === 200) {
        const json: MeOperationResult = await request.json()

        if (json?.user) {
          setUser(json.user)

          if (json?.token) {
            setTokenAndExpiration(json)
          }
        } else {
          setUser(null)
          revokeTokenAndExpire()
        }
      }
    } catch (e) {
      toast.error(`Fetching user failed: ${e.message}`)
    }
  }, [serverURL, apiRoute, userSlug, i18n.language, setTokenAndExpiration, revokeTokenAndExpire])

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
    const now = Math.round(new Date().getTime() / 1000)
    const remainingTime = typeof tokenExpiration === 'number' ? tokenExpiration - now : 0

    if (remainingTime > 0) {
      reminder = setTimeout(
        () => {
          openModal(stayLoggedInModalSlug)
        },
        Math.max(Math.min((remainingTime - 60) * 1000, maxTimeoutTime)),
      )
    }

    return () => {
      if (reminder) clearTimeout(reminder)
    }
  }, [tokenExpiration, openModal])

  useEffect(() => {
    let forceLogOut: ReturnType<typeof setTimeout>
    const now = Math.round(new Date().getTime() / 1000)
    const remainingTime = typeof tokenExpiration === 'number' ? tokenExpiration - now : 0

    if (remainingTime > 0) {
      forceLogOut = setTimeout(
        () => {
          setUser(null)
          revokeTokenAndExpire()
          redirectToInactivityRoute()
        },
        Math.max(Math.min(remainingTime * 1000, maxTimeoutTime), 0),
      )
    }

    return () => {
      if (forceLogOut) clearTimeout(forceLogOut)
    }
  }, [tokenExpiration, closeAllModals, i18n, redirectToInactivityRoute, revokeTokenAndExpire])

  return (
    <Context.Provider
      value={{
        fetchFullUser,
        logOut,
        permissions,
        refreshCookie,
        refreshCookieAsync,
        refreshPermissions,
        setPermissions,
        setUser,
        token: tokenInMemory,
        user,
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useAuth = <T = ClientUser,>(): AuthContext<T> => useContext(Context) as AuthContext<T>
