import type { CollectionConfig } from 'payload'

import { collapsibleFieldsSlug } from '../../slugs.js'
import { getCustomLabel } from './CustomLabel/getCustomLabel.js'

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
                {
                  name: 'requiredTextWithinSubGroup',
                  type: 'text',
                  required: true,
                  defaultValue: 'required text',
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
          Label: getCustomLabel({
            path: 'functionTitleField',
            fallback: 'Custom Collapsible Label',
            style: {},
          }),
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
          Label: getCustomLabel({ path: 'componentTitleField', style: {} }),
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
              Label: getCustomLabel({
                path: 'nestedTitle',
                fallback: 'Nested Collapsible',
                style: {},
              }),
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
          type: 'collapsible',
          admin: {
            components: {
              Label: '/collections/Collapsible/NestedCustomLabel/index.js#NestedCustomLabel',
            },
          },
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
