import type { CollectionSlug, Payload } from '../index.js'

import { isNumber } from './isNumber.js'

type ParseDocumentIDArgs = {
  collectionSlug: CollectionSlug
  id?: number | string
  payload: Payload
}

export function parseDocumentID(
  args: { id: number | string } & ParseDocumentIDArgs,
): number | string
export function parseDocumentID(args: ParseDocumentIDArgs): number | string | undefined
export function parseDocumentID({ id, collectionSlug, payload }: ParseDocumentIDArgs) {
  if (id === undefined) {
    return undefined
  }

  const idType = payload.collections[collectionSlug]?.customIDType ?? payload.db.defaultIDType

  if (idType === 'number') {
    return isNumber(id) ? parseFloat(String(id)) : id
  }

  return String(id)
}
