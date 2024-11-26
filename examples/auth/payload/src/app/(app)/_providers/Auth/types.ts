import type { SanitizedPermissions } from 'payload'

import type { User } from '../../../../payload-types'

export type ResetPassword = (args: {
  password: string
  passwordConfirm: string
  token: string
}) => Promise<undefined | User>

export type ForgotPassword = (args: { email: string }) => Promise<undefined | User>

export type Create = (args: {
  email: string
  firstName: string
  lastName: string
  password: string
}) => Promise<undefined | User>

export type Login = (args: { email: string; password: string }) => Promise<null | undefined | User>

export type Logout = () => Promise<void>

export interface AuthContext {
  create: Create
  forgotPassword: ForgotPassword
  login: Login
  logout: Logout
  permissions?: null | SanitizedPermissions
  resetPassword: ResetPassword
  setPermissions: (permissions: null | SanitizedPermissions) => void
  setUser: (user: null | User) => void
  user?: null | User
}
