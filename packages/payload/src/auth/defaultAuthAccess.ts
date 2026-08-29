import type { Access } from '../config/types.js'

export const defaultAuthAccess: Access = ({ slug, req: { user } }) => {
  if (!user || user.collection !== slug) {
    return false
  }
  return { id: { equals: user.id } }
}
