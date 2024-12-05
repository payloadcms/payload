import type { CollectionConfig } from 'payload'

import { autosaveCollectionSlug } from '../slugs.js'

const AutosavePosts: CollectionConfig = {
  slug: autosaveCollectionSlug,
  labels: {
    singular: 'Autosave Post',
    plural: 'Autosave Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'description', 'createdAt', '_status'],
  },
  versions: {
    maxPerDoc: 35,
    drafts: {
      autosave: {
        interval: 2000,
      },
    },
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) {
        return true
      }

      return {
        or: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            _status: {
              exists: false,
            },
          },
        ],
      }
    },
    readVersions: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      unique: true,
      localized: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
    },
  ],
}

export default AutosavePosts
