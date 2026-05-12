import type { CollectionConfig } from 'payload'

import { autosaveSlug } from '../../slugs.js'

const Autosave: CollectionConfig = {
  slug: autosaveSlug,
  admin: {
    useAsTitle: 'title',
    group: 'Versions',
  },
  versions: {
    drafts: {
      autosave: true,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}

export default Autosave
