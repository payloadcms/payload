import { User, Permissions } from '../../../../auth/types';

export type AuthContext<T = User> = {
  user?: T | null
  logOut: () => void
  refreshCookie: () => void
  setToken: (token: string) => void
  token?: string
  permissions?: Permissions
}
