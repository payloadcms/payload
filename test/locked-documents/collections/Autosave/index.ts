import type { CollectionConfig } from 'payload'

import { autosaveSlug } from '../../slugs.js'

export const AutosaveCollection: CollectionConfig = {
  slug: autosaveSlug,
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
    drafts: {
      autosave: {
        interval: 100,
      },
    },
  },
}
