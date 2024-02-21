import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import CollectionVersionButton from '../elements/CollectionVersionButton'
import CollectionVersionsButton from '../elements/CollectionVersionsButton'
import { CustomPublishButton } from '../elements/CustomSaveButton'
import { draftCollectionSlug } from '../slugs'

const DraftPosts: CollectionConfig = {
  slug: draftCollectionSlug,
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
        PublishButton: CustomPublishButton,
      },
      views: {
        Edit: {
          Version: {
            actions: [CollectionVersionButton],
          },
          Versions: {
            actions: [CollectionVersionsButton],
          },
        },
      },
    },
    defaultColumns: ['title', 'description', 'createdAt', '_status'],
    preview: () => 'https://payloadcms.com',
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
      relationTo: draftCollectionSlug,
    },
  ],
  versions: {
    drafts: true,
    maxPerDoc: 35,
  },
}

export default DraftPosts
