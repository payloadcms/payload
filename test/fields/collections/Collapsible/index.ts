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
        initCollapsed: false,
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
            {
              name: 'subGroup',
              type: 'group',
              fields: [
                {
                  name: 'textWithinSubGroup',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      label: 'Collapsible Field - Collapsed by Default',
      type: 'collapsible',
      admin: {
        description: 'This is a collapsible field.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'someText',
          type: 'text',
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'textWithinGroup',
              type: 'text',
            },
            {
              name: 'subGroup',
              type: 'group',
              fields: [
                {
                  name: 'textWithinSubGroup',
                  type: 'text',
                },
              ],
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
    subGroup: {
      textWithinSubGroup: 'hello, get out',
    },
  },
};

export default CollapsibleFields;
