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
      label: 'Collapsible Header Function',
      type: 'collapsible',
      admin: {
        description: 'Collapsible label rendered from a function.',
        initCollapsed: true,
        components: {
          CollapsibleLabel: ({ data }) => data.functionTitleField || 'Untitled',
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
        {
          type: 'collapsible',
          label: 'Nested Collapsible',
          fields: [
            {
              type: 'text',
              name: 'nestedText',
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
