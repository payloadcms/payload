import type { CollectionSlug, Payload } from '../../../index.js'
import type { PayloadRequest, Where } from '../../../types/index.js'

import { migrateWhere } from './migrateWhere.js'

type SavedFilter = {
  id: number | string
  key?: string
  relatedCollection?: string
  value?: { where?: Where } & Record<string, unknown>
  where?: Where
}

/**
 * Migrates saved Admin filters to the membership operators offered in Payload 4.
 * Run from a database migration and pass its request to keep reads and writes in
 * that migration's transaction. Direct database writes preserve owners and avoid
 * re-running user-dependent preference and query-preset validation hooks.
 *
 * Returns the number of updated presets and legacy collection preferences.
 */
export const migrateHasManyRelationshipFilters = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<number> => {
  let updatedCount = 0

  for (const collection of ['payload-query-presets', 'payload-preferences'] as const) {
    if (!payload.collections[collection]) {
      continue
    }

    let page = 1

    while (true) {
      const result = await payload.db.find<SavedFilter>({
        collection,
        limit: 100,
        page,
        req,
        sort: 'id',
      })

      for (const doc of result.docs) {
        const isPreset = collection === 'payload-query-presets'
        const collectionSlug = isPreset
          ? doc.relatedCollection
          : typeof doc.key === 'string' && doc.key.startsWith('collection-')
            ? doc.key.slice('collection-'.length)
            : undefined
        const collectionConfig =
          collectionSlug && payload.collections[collectionSlug as CollectionSlug]?.config
        const where = isPreset ? doc.where : doc.value?.where

        if (!collectionConfig || !where) {
          continue
        }

        const migratedWhere = migrateWhere({
          config: payload.config,
          fields: collectionConfig.flattenedFields,
          where,
        })

        if (migratedWhere === where) {
          continue
        }

        await payload.db.updateOne({
          id: doc.id,
          collection,
          data: isPreset
            ? { where: migratedWhere }
            : { value: { ...doc.value, where: migratedWhere } },
          req,
          returning: false,
        })
        updatedCount++
      }

      if (!result.hasNextPage) {
        break
      }

      page++
    }
  }

  return updatedCount
}
