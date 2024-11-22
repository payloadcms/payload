import type { Access } from 'payload'

export const loggedIn: Access = ({ req: { user } }) => {
  return Boolean(user)
}
