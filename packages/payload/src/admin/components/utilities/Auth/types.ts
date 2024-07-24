import type { Permissions, User } from '../../../../auth/types'

export type AuthContext<T = User> = {
  fetchFullUser: () => Promise<void>
  logOut: () => Promise<void>
  permissions?: Permissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<User>
  refreshPermissions: ({ locale }?: { locale?: string }) => Promise<void>
  setUser: (user: T) => Promise<void>
  strategy?: string
  token?: string
  tokenExpiration?: number
  user?: T | null
}
