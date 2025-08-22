import type { CollectionConfig } from 'payload'

import { autosaveGlobalSlug } from '../shared.js'

export const AutosaveGlobal: CollectionConfig = {
  slug: autosaveGlobalSlug,
  admin: {
    useAsTitle: 'title',
    group: 'Tenant Globals',
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
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
