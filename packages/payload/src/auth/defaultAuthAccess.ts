import type { Access } from '../config/types.js'

export const defaultAuthAccess: Access = ({ req: { user } }) => {
  if (!user) {
    return false
  }
  return { id: { equals: user.id } }
}
