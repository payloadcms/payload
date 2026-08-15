import type { Access } from '../config/types.js'

export const defaultAuthAccess =
  (collectionSlug: string): Access =>
  ({ req: { user } }) => {
    if (!user || user.collection !== collectionSlug) {
      return false
    }
    return { id: { equals: user.id } }
  }
