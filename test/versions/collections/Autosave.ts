import type { CollectionConfig } from 'payload'

import { autosaveCollectionSlug, postCollectionSlug } from '../slugs.js'

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
        interval: 100,
      },
      schedulePublish: true,
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
      name: 'relationship',
      type: 'relationship',
      relationTo: postCollectionSlug,
      admin: {
        components: {
          Label: './elements/CustomFieldLabel/index.tsx#CustomFieldLabel',
        },
      },
    },
    {
      name: 'computedTitle',
      label: 'Computed Title',
      type: 'text',
      hooks: {
        beforeChange: [({ data }) => data?.title],
      },
    },
    {
      name: 'richText',
      type: 'richText',
    },
    {
      name: 'json',
      type: 'json',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
}

export default AutosavePosts
