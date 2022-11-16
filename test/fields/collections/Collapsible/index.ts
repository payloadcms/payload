import type { CollectionConfig } from '../../../../src/collections/config/types';
import { CollapsibleLabelComponent } from './LabelComponent';

export const collapsibleFieldsSlug = 'collapsible-fields';

const CollapsibleFields: CollectionConfig = {
  slug: collapsibleFieldsSlug,
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
      label: ({ data }) => data.functionTitleField || 'Custom Collapsible Label',
      type: 'collapsible',
      admin: {
        description: 'Collapsible label rendered from a function.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'functionTitleField',
          type: 'text',
        },
      ],
    },
    {
      label: ({ data }) => data?.componentTitleField || 'Untitled',
      type: 'collapsible',
      admin: {
        description: 'Collapsible label rendered as a react component.',
      },
      fields: [
        {
          name: 'componentTitleField',
          type: 'text',
        },
        {
          type: 'collapsible',
          label: ({ data }) => data?.nestedTitle || 'Nested Collapsible',
          fields: [
            {
              type: 'text',
              name: 'nestedTitle',
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          label: CollapsibleLabelComponent,
          type: 'collapsible',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      name: 'arrayWithCollapsibles',
      type: 'array',
      fields: [
        {
          type: 'collapsible',
          label: 'Collapsible In Array',
          fields: [
            {
              type: 'text',
              name: 'title',
            },
            {
              type: 'text',
              name: 'description',
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
