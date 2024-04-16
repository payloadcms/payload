import type { User } from '../../../../payload-types'

// eslint-disable-next-line no-unused-vars
export type ResetPassword = (args: {
  password: string
  passwordConfirm: string
  token: string
}) => Promise<User>

export type ForgotPassword = (args: { email: string }) => Promise<User> // eslint-disable-line no-unused-vars

export type Create = (args: {
  email: string
  firstName: string
  lastName: string
  password: string
}) => Promise<User> // eslint-disable-line no-unused-vars

export type Login = (args: { email: string; password: string }) => Promise<User> // eslint-disable-line no-unused-vars

export type Logout = () => Promise<void>

export interface AuthContext {
  create: Create
  forgotPassword: ForgotPassword
  login: Login
  logout: Logout
  resetPassword: ResetPassword
  setUser: (user: User | null) => void // eslint-disable-line no-unused-vars
  user?: User | null
}
