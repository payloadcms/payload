import { CollectionConfig } from '../../../src/collections/config/types';

export const Pages: CollectionConfig = {
  slug: 'pages',
  // TODO: wire up versions methods
  // versions: {
  //   drafts: true,
  // },
  fields: [
    {
      name: 'slug',
      type: 'text',
      localized: true,
    },
  ],
};
