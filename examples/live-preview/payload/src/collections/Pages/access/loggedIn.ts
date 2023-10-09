import type { Access } from 'payload/config'

export const loggedIn: Access = ({ req: { user } }) => {
  return Boolean(user)
}
