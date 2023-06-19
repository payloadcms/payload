import { User, Permissions } from '../../../../auth/types';

export type AuthContext<T = User> = {
  user?: T | null
  setUser: (user: T) => void
  logOut: () => void
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<User>
  setToken: (token: string) => void
  token?: string
  refreshPermissions: () => Promise<void>
  permissions?: Permissions
}
