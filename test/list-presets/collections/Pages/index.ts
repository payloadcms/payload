import type { CollectionConfig } from 'payload'

import { pagesSlug } from '../../slugs.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'text',
  },
  enableListPresets: true,
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
