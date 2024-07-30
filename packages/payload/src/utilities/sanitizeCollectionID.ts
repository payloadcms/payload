import type { Payload } from '..'

import flattenFields from './flattenTopLevelFields'

type Args = {
  collectionSlug: string
  id: string
  payload: Payload
}

export const sanitizeCollectionID = ({ id, collectionSlug, payload }: Args): number | string => {
  let sanitizedID: number | string = id
  const collection = payload.collections[collectionSlug]

  // If default db ID type is a number, we should sanitize
  let shouldSanitize = Boolean(payload.db.defaultIDType === 'number')

  // UNLESS the custom ID for this collection is text.... then we leave it
  const hasIdField = flattenFields(collection.config.fields).find((field) => field.name === 'id')

  if (shouldSanitize && hasIdField) shouldSanitize = false

  // If we still should sanitize, parse float
  if (shouldSanitize) sanitizedID = parseFloat(sanitizedID)

  return sanitizedID
}
