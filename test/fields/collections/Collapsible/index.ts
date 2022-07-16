import type { CollectionConfig } from '../../../../src/collections/config/types';

const CollapsibleFields: CollectionConfig = {
  slug: 'collapsible-fields',
  versions: true,
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
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'textWithinGroup',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
};

export const collapsibleDoc = {
  text: 'Seeded collapsible doc',
  group: {
    textWithinGroup: 'some text within a group',
  },
};

export default CollapsibleFields;
