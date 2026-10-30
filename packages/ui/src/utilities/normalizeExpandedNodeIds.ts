import type { CollectionSlug, Payload } from 'payload'

import { parseDocumentID } from 'payload'

/**
 * Saved preferences and URL params give string IDs, while documents read from the database
 * give the collection's real ID type. Converting each ID to that type keeps one entry per node.
 */
export const normalizeExpandedNodeIds = ({
  collectionSlug,
  ids,
  payload,
}: {
  collectionSlug: CollectionSlug
  ids: (number | string)[]
  payload: Payload
}): (number | string)[] =>
  Array.from(new Set(ids.map((id) => parseDocumentID({ id, collectionSlug, payload }))))
