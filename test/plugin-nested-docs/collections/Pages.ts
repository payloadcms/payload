import type { CollectionConfig } from 'payload'

import { populateFullTitle } from './populateFullTitle.js'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'fullTitle',
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
    },
    {
      name: 'fullTitle',
      type: 'text',
      localized: true,
      hooks: {
        beforeChange: [populateFullTitle],
      },
      admin: {
        components: {
          Field: null,
        },
      },
    },
  ],
}
