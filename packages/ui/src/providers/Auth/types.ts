import type { Permissions, User } from 'payload/auth'

export type AuthContext<T = User> = {
  fetchFullUser: () => Promise<void>
  logOut: () => void
  permissions?: Permissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<User>
  refreshPermissions: () => Promise<void>
  setUser: (user: T) => void
  token?: string
  user?: T | null
}
