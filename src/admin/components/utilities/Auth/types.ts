import { User, Permissions } from '../../../../auth/types';

export type AuthContext<T = User> = {
  user?: T | null
  setUser: (user: T) => void
  logOut: () => void
  refreshCookie: () => void
  setToken: (token: string) => void
  token?: string
  refreshPermissions: () => Promise<void>
  permissions?: Permissions
}
