import { CollectionConfig } from '../../../src/collections/config/types';

export const LocalizedGroups: CollectionConfig = {
  slug: 'localized-groups',
  fields: [
    {
      name: 'group',
      type: 'group',
      localized: true,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
      ],
    },
  ],
};
