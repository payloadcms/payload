import type { CollectionConfig } from 'payload'

import { failingResaveSlug } from '../shared.js'
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
  generateFrontendPath: ({ doc }) => doc.breadcrumbs?.at(-1)?.path ?? null,
  versions: {
    drafts: {
      schedulePublish: true,
    },
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        if (operation === 'update' && originalDoc?.slug === failingResaveSlug) {
          throw new Error('Failed to resave child')
        }

        return data
      },
    ],
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
