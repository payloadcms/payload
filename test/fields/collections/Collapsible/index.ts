import type { CollectionConfig } from 'payload'

import { collapsibleFieldsSlug } from '../../slugs.js'

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
          name: 'group2',
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
      type: 'collapsible',
      admin: {
        description: 'Collapsible label rendered from a function.',
        initCollapsed: true,
        components: {
          RowLabel: {
            clientProps: {
              path: 'functionTitleField',
              fallback: 'Custom Collapsible Label',
            },
            path: '/collections/Collapsible/NestedCustomLabel/index.js#NestedCustomLabel',
          },
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
      type: 'collapsible',
      admin: {
        description: 'Collapsible label rendered as a react component.',
        components: {
          RowLabel: {
            clientProps: {
              path: 'componentTitleField',
            },
            path: '/collections/Collapsible/NestedCustomLabel/index.js#NestedCustomLabel',
          },
        },
      },
      fields: [
        {
          name: 'componentTitleField',
          type: 'text',
        },
        {
          type: 'collapsible',
          admin: {
            components: {
              RowLabel: {
                clientProps: {
                  path: 'nestedTitle',
                  fallback: 'Nested Collapsible',
                },
                path: '/collections/Collapsible/NestedCustomLabel/index.js#NestedCustomLabel',
              },
            },
          },
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
      name: 'arrayWithCollapsibles',
      type: 'array',
      fields: [
        {
          admin: {
            components: {
              RowLabel: '/collections/Collapsible/NestedCustomLabel/index.js#NestedCustomLabel',
            },
          },
          type: 'collapsible',
          fields: [
            {
              name: 'innerCollapsible',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}

export default CollapsibleFields
