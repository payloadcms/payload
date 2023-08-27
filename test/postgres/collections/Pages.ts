import { CollectionConfig } from '../../../src/collections/config/types';

export const Pages: CollectionConfig = {
  slug: 'pages',
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      localized: true,
    },
  ],
};
