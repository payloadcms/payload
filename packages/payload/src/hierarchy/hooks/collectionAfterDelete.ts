/**
 * afterDelete Hook Responsibilities:
 * - Clear folder references from related documents when folder is deleted
 */

import type { CollectionAfterDeleteHook } from '../../index.js'
import type { SanitizedHierarchyRelatedCollection } from '../types.js'

type Args = {
  /**
   * Map of collection slugs to their field info
   */
  relatedCollections: Record<string, SanitizedHierarchyRelatedCollection>
}

export const hierarchyCollectionAfterDelete =
  ({ relatedCollections }: Args): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    for (const [collectionSlug, { fieldName, hasMany }] of Object.entries(relatedCollections)) {
      const where = {
        [fieldName]: {
          equals: id,
        },
      }

      if (!hasMany) {
        await req.payload.update({
          collection: collectionSlug,
          data: {
            [fieldName]: null,
          },
          overrideAccess: true,
          req,
          where,
        })

        continue
      }

      const { docs } = await req.payload.find({
        collection: collectionSlug,
        depth: 0,
        overrideAccess: true,
        pagination: false,
        req,
        select: {
          [fieldName]: true,
        },
        where,
      })

      for (const doc of docs) {
        const values = (doc[fieldName] as (number | string)[] | null) ?? []

        await req.payload.update({
          id: doc.id,
          collection: collectionSlug,
          data: {
            [fieldName]: values.filter((value) => value !== id),
          },
          overrideAccess: true,
          req,
        })
      }
    }
  }
