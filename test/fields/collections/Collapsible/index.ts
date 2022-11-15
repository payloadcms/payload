import type { CollectionConfig } from '../../../../src/collections/config/types';
import { CollapsibleLabelComponent } from './HeaderComponent';

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
    {
      label: 'Collapsible Header Function',
      type: 'collapsible',
      admin: {
        description: 'Collapsible label rendered from a function.',
        initCollapsed: true,
        components: {
          CollapsibleLabel: ({ collapsibleData }) => collapsibleData.functionTitleField || 'Untitled',
        },
      },
      fields: [
        {
          name: 'functionTitleField',
          type: 'text',
        },
      ],
    },
    {
      label: 'Collapsible Header Component',
      type: 'collapsible',
      admin: {
        description: 'Collapsible label rendered as a react component.',
        initCollapsed: true,
        components: {
          CollapsibleLabel: CollapsibleLabelComponent,
        },
      },
      fields: [
        {
          name: 'componentTitleField',
          type: 'text',
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
