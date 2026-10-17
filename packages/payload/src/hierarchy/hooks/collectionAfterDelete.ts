/**
 * afterDelete Hook Responsibilities:
 * - Clear hierarchy references from related documents when a hierarchy item is deleted
 * - For multi-value (hasMany) fields (e.g. tags), remove only the deleted id
 *   from the list instead of clearing the whole field
 */

import type { CollectionAfterDeleteHook } from '../../index.js'

import { extractID } from '../../utilities/extractID.js'

type RelatedCollectionConfig = {
  fieldName: string
  hasMany: boolean
}

type Args = {
  /**
   * Map of collection slugs to their hierarchy field name and hasMany status
   */
  relatedCollections: Record<string, RelatedCollectionConfig>
}

/**
 * Removes the deleted id from a relationship field value, keeping every other
 * value untouched. Handles plain arrays and localized objects of arrays.
 */
const removeIDFromValue = (value: unknown, id: string | number): unknown => {
  const target = String(id)

  const filterArray = (arr: unknown[]): unknown[] =>
    arr.filter(
      (item) => String(extractID(item as { id: string | number } | string | number)) !== target,
    )

  if (Array.isArray(value)) {
    return filterArray(value)
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [locale, localeValue] of Object.entries(value)) {
      result[locale] = Array.isArray(localeValue) ? filterArray(localeValue) : localeValue
    }
    return result
  }

  return value
}

export const hierarchyCollectionAfterDelete =
  ({ relatedCollections }: Args): CollectionAfterDeleteHook =>
  async ({ id, req }) => {
    for (const [collectionSlug, { fieldName, hasMany }] of Object.entries(relatedCollections)) {
      if (!hasMany) {
        // Single-value field (e.g. a folder reference): clear it entirely
        await req.payload.update({
          collection: collectionSlug,
          data: {
            [fieldName]: null,
          },
          overrideAccess: true,
          req,
          where: {
            [fieldName]: {
              equals: id,
            },
          },
        })
        continue
      }

      // Multi-value field (e.g. tags): remove only the deleted id from each
      // document's list, keeping the remaining values
      let page = 1
      const limit = 100

      for (;;) {
        const { docs, hasNextPage } = await req.payload.find({
          collection: collectionSlug,
          depth: 0,
          limit,
          overrideAccess: true,
          page,
          req,
          select: {
            [fieldName]: true,
          },
          where: {
            [fieldName]: {
              equals: id,
            },
          },
        })

        for (const doc of docs) {
          await req.payload.update({
            id: doc.id,
            collection: collectionSlug,
            data: {
              [fieldName]: removeIDFromValue(doc[fieldName as keyof typeof doc], id),
            },
            overrideAccess: true,
            req,
          })
        }

        if (!hasNextPage) {
          break
        }
        page += 1
      }
    }
  }
