import type { CollectionConfig } from 'payload'

import { simpleSlug } from '../../slugs.js'

export const SimpleCollection: CollectionConfig = {
  slug: simpleSlug,
  admin: {
    useAsTitle: 'fieldA',
  },
  fields: [
    {
      name: 'fieldA',
      type: 'text',
    },
    {
      name: 'fieldB',
      type: 'text',
    },
  ],
  versions: {
    drafts: true,
  },
}
