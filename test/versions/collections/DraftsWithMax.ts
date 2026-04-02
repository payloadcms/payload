import type { CollectionConfig } from 'payload'

import { draftWithMaxCollectionSlug } from '../slugs.js'

const DraftWithMaxPosts: CollectionConfig = {
  slug: draftWithMaxCollectionSlug,
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
    components: {
      edit: {
        PublishButton: '/elements/CustomSaveButton/index.js#CustomPublishButton',
      },
      views: {
        edit: {
          version: {
            actions: ['/elements/CollectionVersionButton/index.js'],
          },
          versions: {
            actions: ['/elements/CollectionVersionsButton/index.js'],
          },
        },
      },
    },
    defaultColumns: ['title', 'description', 'createdAt', '_status'],
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
    {
      name: 'radio',
      type: 'radio',
      options: [
        {
          label: { en: 'Test en', es: 'Test es' },
          value: 'test',
        },
      ],
    },
    {
      name: 'select',
      type: 'select',
      hasMany: true,
      options: [
        {
          label: { en: 'Test1 en', es: 'Test1 es' },
          value: 'test1',
        },
        {
          label: { en: 'Test2 en', es: 'Test2 es' },
          value: 'test2',
        },
      ],
    },
    {
      name: 'blocksField',
      type: 'blocks',
      blocks: [
        {
          slug: 'block',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'localized',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'relation',
      type: 'relationship',
      relationTo: draftWithMaxCollectionSlug,
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 1,
  },
}

export default DraftWithMaxPosts
