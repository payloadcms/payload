import type { CollectionConfig } from 'payload'

import { pagesSlug } from '../../slugs.js'

export const PagesCollection: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'text',
  },
  lockDocuments: false,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
