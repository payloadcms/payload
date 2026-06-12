/**
 * afterDelete Hook Responsibilities:
 * - Clear folder references from related documents when folder is deleted
 */

import type { CollectionAfterDeleteHook } from '../../index.js'

type Args = {
  /**
   * Map of collection slugs to their field names
   */
  relatedCollections: Record<string, string>
}

export const hierarchyCollectionAfterDelete =
  ({ relatedCollections }: Args): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    for (const [collectionSlug, fieldName] of Object.entries(relatedCollections)) {
      await req.payload.update({
        collection: collectionSlug,
        data: {
          [fieldName]: null,
        },
        req,
        where: {
          [fieldName]: {
            equals: id,
          },
        },
      })
    }
  }
