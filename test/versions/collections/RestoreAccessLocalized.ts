import type { CollectionConfig } from 'payload'

import { restoreAccessLocalizedCollectionSlug } from '../slugs.js'

/**
 * Collection used to verify that version restore evaluates `access.update` with the correct
 * publication intent when `_status` is per-locale. A localized field plus config localization
 * auto-enables `versions.drafts.localizeStatus`, so `_status` is stored per locale. The access
 * rule is driven by `req.context` so a single collection can exercise the unpublish gate that
 * inspects `data._status`.
 */
const RestoreAccessLocalized: CollectionConfig = {
  slug: restoreAccessLocalizedCollectionSlug,
  access: {
    update: ({ data, req: { context } }) => {
      if (context?.restoreAccessMode === 'allow') {
        return true
      }

      // Unpublish gate: a non-publisher may not take any locale offline.
      if (context?.restoreAccessMode === 'unpublishGate') {
        return data?._status !== 'draft'
      }

      return true
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
}

export default RestoreAccessLocalized
