import type { FieldAccess } from '../../../fields/config/types.js'

/** Allows users to read only the API key stored on their own auth document. */
export const canReadAPIKey: FieldAccess = ({ id, collection, req }) =>
  Boolean(
    req.user &&
      id !== undefined &&
      String(req.user.id) === String(id) &&
      req.user.collection === collection?.slug,
  )
