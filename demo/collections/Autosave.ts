import { CollectionConfig } from '../../src/collections/config/types';

const Autosave: CollectionConfig = {
  slug: 'autosave-posts',
  labels: {
    singular: 'Autosave Post',
    plural: 'Autosave Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'description',
      'createdAt',
    ],
  },
  versions: {
    maxPerDoc: 5,
    retainDeleted: false,
    drafts: {
      autosave: {
        interval: 5,
      },
    },
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
  ],
  timestamps: true,
};

export default Autosave;
