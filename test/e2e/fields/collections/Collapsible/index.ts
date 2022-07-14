import type { CollectionConfig } from '../../../../../src/collections/config/types';

const CollapsibleFields: CollectionConfig = {
  slug: 'collapsible-fields',
  fields: [
    {
      label: 'Collapsible Field',
      type: 'collapsible',
      admin: {
        description: 'This is a collapsible field.',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
};

export const collapsibleDoc = {
  text: 'Seeded collapsible doc',
};

export default CollapsibleFields;
