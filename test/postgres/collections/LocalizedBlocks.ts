import { CollectionConfig } from '../../../src/collections/config/types';

export const LocalizedBlocks: CollectionConfig = {
  slug: 'localized-blocks',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'layout',
      type: 'blocks',
      required: true,
      localized: true,
      blocks: [
        {
          slug: 'text',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
          ],
        },
        {
          slug: 'number',
          fields: [
            {
              name: 'number',
              type: 'number',
            },
          ],
        },
      ],
    },
  ],
};
