import type { CollectionConfig } from 'payload'

import { customDocumentControlsSlug } from '../slugs.js'

export const CollectionCustomDocumentControls: CollectionConfig = {
  slug: customDocumentControlsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
