import type { PayloadRequest, RecentlyViewedPreferences } from 'payload'

import { addRecentlyViewedItem, upsertPreferences } from '@payloadcms/ui/rsc'
import { PREFERENCE_KEYS } from 'payload/shared'

/**
 * Records that the current user viewed a collection document, persisting it to the
 * `recently-viewed` preference. The document is loaded with access control before this runs, so
 * reaching here means the user can read it. Never throws: a failed write must not break the view.
 */
export const recordRecentlyViewed = async ({
  id,
  collectionSlug,
  req,
}: {
  collectionSlug: string
  id: number | string
  req: PayloadRequest
}): Promise<void> => {
  if (!req.user) {
    return
  }

  try {
    await upsertPreferences<RecentlyViewedPreferences>({
      customMerge: (existingValue, incomingValue) =>
        addRecentlyViewedItem({ existing: existingValue, item: incomingValue.items[0] }),
      key: PREFERENCE_KEYS.RECENTLY_VIEWED,
      req,
      value: { items: [{ id, collectionSlug, viewedAt: new Date().toISOString() }] },
    })
  } catch (err) {
    req.payload.logger.error({
      err,
      msg: `Failed to record recently viewed document "${collectionSlug}/${id}"`,
    })
  }
}
