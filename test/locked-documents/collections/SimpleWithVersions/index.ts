import type { CollectionConfig } from 'payload'

import { simpleWithVersionsSlug } from '../../slugs.js'

export const SimpleWithVersionsCollection: CollectionConfig = {
  slug: simpleWithVersionsSlug,
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
