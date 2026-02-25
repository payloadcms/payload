import type { CollectionConfig } from 'payload'

import { draftsNoReadVersionsSlug } from '../slugs.js'

const DraftsNoReadVersions: CollectionConfig = {
  slug: draftsNoReadVersionsSlug,
  access: {
    readVersions: () => false,
  },
  admin: {
    defaultColumns: ['title', 'createdAt', '_status'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
  versions: {
    drafts: true,
  },
}

export default DraftsNoReadVersions
