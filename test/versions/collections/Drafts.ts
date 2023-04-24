import type { CollectionConfig } from '../../../src/collections/config/types';
import { draftSlug } from '../shared';

const DraftPosts: CollectionConfig = {
  slug: draftSlug,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'description', 'createdAt', '_status'],
    preview: () => 'https://payloadcms.com',
  },
  versions: {
    maxPerDoc: 35,
    drafts: true,
  },
  access: {
    read: ({ req: { user } }) => {
      if (user) {
        return true;
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
      };
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
    {
      name: 'radio',
      type: 'radio',
      options: [
        {
          value: 'test',
          label: { en: 'Test en', es: 'Test es' },
        },
      ],
    },
    {
      name: 'select',
      type: 'select',
      hasMany: true,
      options: [
        {
          value: 'test1',
          label: { en: 'Test1 en', es: 'Test1 es' },
        },
        {
          value: 'test2',
          label: { en: 'Test2 en', es: 'Test2 es' },
        },
      ],
    },
  ],
};

export default DraftPosts;
