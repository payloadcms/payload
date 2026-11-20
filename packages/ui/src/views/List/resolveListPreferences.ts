import type { CollectionPreferences, ListQuery, PayloadRequest } from 'payload'

import { isNumber, transformColumnsToPreferences } from 'payload/shared'

import { getPreferences, upsertPreferences } from '../../utilities/upsertPreferences.js'

export async function resolveListPreferences({
  collectionSlug,
  hasTreeLayout,
  query,
  req,
}: {
  collectionSlug: string
  hasTreeLayout: boolean
  query: ListQuery
  req: PayloadRequest
}): Promise<{
  collectionPreferences: CollectionPreferences | undefined
  isSavedTreeLayout: boolean
}> {
  const preferencesKey = `collection-${collectionSlug}`
  const savedCollectionPreferences =
    hasTreeLayout && req.user
      ? (
          await getPreferences<CollectionPreferences>(
            preferencesKey,
            req.payload,
            req.user.id,
            req.user.collection,
          )
        )?.value
      : undefined
  const isSavedTreeLayout = hasTreeLayout && savedCollectionPreferences?.documentLayout === 'tree'

  // Tree URL state must not replace the saved Table grouping, columns, or sort preferences.
  const collectionPreferences = isSavedTreeLayout
    ? savedCollectionPreferences
    : await upsertPreferences<CollectionPreferences>({
        key: preferencesKey,
        req,
        value: {
          columns: transformColumnsToPreferences(query.columns),
          groupBy: query.groupBy,
          limit: isNumber(query.limit) ? Number(query.limit) : undefined,
          preset: query.preset,
          sort: query.sort as string,
        },
      })

  return { collectionPreferences, isSavedTreeLayout }
}
