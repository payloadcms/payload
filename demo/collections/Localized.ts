import { PayloadCollectionConfig } from '../../src/collections/config/types';

const LocalizedPosts: PayloadCollectionConfig = {
  slug: 'localized-posts',
  labels: {
    singular: 'Localized Post',
    plural: 'Localized Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'priority',
      'createdAt',
    ],
    enableRichTextRelationship: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      maxLength: 100,
      required: true,
      unique: true,
      localized: true,
    },
    {
      name: 'summary',
      label: 'Summary',
      type: 'text',
      index: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      required: true,
      localized: true,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'number',
      required: true,
      localized: true,
    },
  ],
  timestamps: true,
};

export default LocalizedPosts;
