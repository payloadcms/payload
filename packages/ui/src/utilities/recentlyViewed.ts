import type { RecentlyViewedItem, RecentlyViewedPreferences } from 'payload'

/**
 * Maximum number of documents retained in the `recently-viewed` preference. The dashboard widget
 * typically shows fewer; the extra entries act as a buffer once excluded collections are filtered.
 */
export const recentlyViewedMaxItems = 20

const isSameDocument = (a: RecentlyViewedItem, b: RecentlyViewedItem) =>
  a.collectionSlug === b.collectionSlug && String(a.id) === String(b.id)

/**
 * Returns a new preference value with `item` moved to the front, deduped by collection + id, and
 * capped at `max`. Pure so it can be unit tested and reused as `upsertPreferences`' customMerge.
 */
export const addRecentlyViewedItem = ({
  existing,
  item,
  max = recentlyViewedMaxItems,
}: {
  existing: RecentlyViewedPreferences | undefined
  item: RecentlyViewedItem
  max?: number
}): RecentlyViewedPreferences => {
  const previousItems = Array.isArray(existing?.items) ? existing.items : []
  const withoutDuplicate = previousItems.filter(
    (existingItem) => !isSameDocument(existingItem, item),
  )

  return {
    items: [item, ...withoutDuplicate].slice(0, max),
  }
}
