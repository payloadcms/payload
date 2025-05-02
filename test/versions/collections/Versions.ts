import type { CollectionConfig } from 'payload'

import { versionCollectionSlug } from '../slugs.js'

const VersionPosts: CollectionConfig = {
  slug: versionCollectionSlug,
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
  admin: {
    defaultColumns: ['title', 'description', 'createdAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      localized: true,
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      required: true,
    },
  ],
  versions: {
    drafts: false,
    maxPerDoc: 2,
  },
}

export default VersionPosts
