import type { CollectionConfig } from 'payload'

import { draftVersionsSlug } from '../../slugs.js'

const DraftVersions: CollectionConfig = {
  slug: draftVersionsSlug,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'createdAt'],
    group: 'Versions',
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}

export default DraftVersions
