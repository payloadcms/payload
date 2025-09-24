import type { CollectionSlug, Payload } from 'payload'

type Args = {
  collectionSlug: CollectionSlug
  payload: Payload
}
export const getCollectionIDType = ({ collectionSlug, payload }: Args): 'number' | 'text' => {
  return payload.collections[collectionSlug]?.customIDType ?? payload.db.defaultIDType
}
