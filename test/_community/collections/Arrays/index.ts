import type { CollectionConfig } from '../../../../src/collections/config/types';

export const Arrays: CollectionConfig = {
  slug: 'arrays',
  fields: [
    {
      name: 'maxRows1',
      type: 'array',
      label: 'Max rows 1',
      maxRows: 1,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      name: 'maxRows3',
      type: 'array',
      label: 'Max rows 3',
      maxRows: 3,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      name: 'maxRows5',
      type: 'array',
      label: 'Max rows 5',
      maxRows: 5,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    }
  ],
};
