import type { Permissions, User } from '../../../../auth/types'

export type AuthContext<T = User> = {
  logOut: () => void
  permissions?: Permissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<User>
  refreshPermissions: () => Promise<void>
  setUser: (user: T) => void
  token?: string
  user?: T | null
  fetchFullUser: () => Promise<void>
}
