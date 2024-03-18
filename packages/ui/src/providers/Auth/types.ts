import type { ClientUser, Permissions } from 'payload/auth'

export type AuthContext<T = ClientUser> = {
  fetchFullUser: () => Promise<void>
  logOut: () => void
  permissions?: Permissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<ClientUser>
  refreshPermissions: () => Promise<void>
  setPermissions: (permissions: Permissions) => void
  setUser: (user: T) => void
  token?: string
  user?: T | null
}
