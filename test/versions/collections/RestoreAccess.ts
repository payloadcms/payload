import type { CollectionConfig } from 'payload'

import { restoreAccessCollectionSlug } from '../slugs.js'

/**
 * Collection used to verify that version restore evaluates `access.update` with the
 * publication state the restore will write. The access rule is driven by `req.context` so a
 * single collection can exercise publish/unpublish gates that inspect `data._status` - mirroring
 * how the admin UI computes publish permission.
 */
const RestoreAccess: CollectionConfig = {
  slug: restoreAccessCollectionSlug,
  access: {
    update: ({ data, req: { context } }) => {
      if (context?.restoreAccessMode === 'allow') {
        return true
      }

      if (context?.restoreAccessMode === 'deny') {
        return false
      }

      // Publish gate: a non-publisher may not set the document to published.
      if (context?.restoreAccessMode === 'publishGate') {
        return data?._status !== 'published'
      }

      // Unpublish gate: a non-publisher may not set the document to draft.
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
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
}

export default RestoreAccess
