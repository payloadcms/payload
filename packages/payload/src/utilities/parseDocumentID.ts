import type { CollectionSlug, Payload } from '../index.js'

import { isNumber } from './isNumber.js'

type ParseDocumentIDArgs = {
  collectionSlug: CollectionSlug
  id?: number | string
  payload: Payload
}

export function parseDocumentID({ id, collectionSlug, payload }: ParseDocumentIDArgs) {
  const idType = payload.collections[collectionSlug]?.customIDType ?? payload.db.defaultIDType

  return id ? (idType === 'number' && isNumber(id) ? parseFloat(String(id)) : id) : undefined
}
