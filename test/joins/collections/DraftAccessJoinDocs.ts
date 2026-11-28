import type { CollectionConfig } from 'payload'

import { draftAccessJoinDocsSlug, draftAccessJoinParentsSlug } from '../shared.js'

export const DraftAccessJoinDocs: CollectionConfig = {
  slug: draftAccessJoinDocsSlug,
  access: {
    read: ({ req }) => {
      // Access where that names `id` — triggers ambiguous parent_id on draft joins (drizzle).
      if (typeof req.context?.allowedDraftJoinDocID !== 'undefined') {
        return { id: { equals: req.context.allowedDraftJoinDocID } }
      }

      return true
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: draftAccessJoinParentsSlug,
    },
  ],
  versions: {
    drafts: true,
  },
}
