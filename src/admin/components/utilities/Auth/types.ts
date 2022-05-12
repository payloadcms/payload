import { User, Permissions } from '../../../../auth/types';

export type AuthContext = {
  user?: User | null
  logOut: () => void
  refreshCookie: () => void
  setToken: (token: string) => void
  token?: string
  permissions?: Permissions
}
