import type { CollectionConfig } from '../../../../src/collections/config/types';

const GroupFields: CollectionConfig = {
  slug: 'group-fields',
  versions: true,
  fields: [
    {
      label: 'Group Field',
      name: 'group',
      type: 'group',
      admin: {
        description: 'This is a group.',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'subGroup',
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

export const groupDoc = {
  group: {
    text: 'some text within a group',
    subGroup: {
      textWithinGroup: 'please',
    },
  },
};

export default GroupFields;
