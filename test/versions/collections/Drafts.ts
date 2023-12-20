import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { extractTranslations } from '../../../packages/payload/src/translations/extractTranslations'
import CollectionVersionButton from '../elements/CollectionVersionButton'
import CollectionVersionsButton from '../elements/CollectionVersionsButton'
import { CustomPublishButton } from '../elements/CustomSaveButton'
import { draftCollectionSlug } from '../slugs'

const labels = extractTranslations(['version:draft', 'version:published', 'version:status'])

const DraftPosts: CollectionConfig = {
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
      label: 'Title',
      localized: true,
      required: true,
      type: 'text',
      unique: true,
    },
    {
      name: 'description',
      label: 'Description',
      required: true,
      type: 'textarea',
    },
    {
      name: 'radio',
      options: [
        {
          label: { en: 'Test en', es: 'Test es' },
          value: 'test',
        },
      ],
      type: 'radio',
    },
    {
      name: 'select',
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
      type: 'select',
    },
    {
      name: 'blocksField',
      blocks: [
        {
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'localized',
              localized: true,
              type: 'text',
            },
          ],
          slug: 'block',
        },
      ],
      type: 'blocks',
    },
  ],
  slug: draftCollectionSlug,
  versions: {
    drafts: true,
    maxPerDoc: 35,
  },
}

export default DraftPosts
