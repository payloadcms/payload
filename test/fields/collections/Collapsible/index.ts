import type { CollectionConfig } from 'payload/types'

import { collapsibleFieldsSlug } from '../../slugs.js'
import { getCustomLabel } from './CustomLabel/getCustomLabel.js'
import { CustomLabelComponent } from './CustomLabel/index.js'

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
      label: () =>
        getCustomLabel({
          path: 'functionTitleField',
          fallback: 'Custom Collapsible Label',
          style: {},
        }),
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
      label: () => getCustomLabel({ path: 'componentTitleField', style: {} }),
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
          label: () =>
            getCustomLabel({ path: 'nestedTitle', fallback: 'Nested Collapsible', style: {} }),
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
          label: CustomLabelComponent,
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
