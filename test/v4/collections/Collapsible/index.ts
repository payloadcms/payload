import type { CollectionConfig } from 'payload'

import { collapsibleFieldsSlug } from '../../slugs.js'

const CollapsibleFields: CollectionConfig = {
  slug: collapsibleFieldsSlug,
  fields: [
    {
      type: 'collapsible',
      label: 'SEO Options',
      fields: [
        {
          name: 'nestedField',
          type: 'text',
          label: 'Nested Field',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'SEO Options',
      fields: [
        {
          name: 'nestedFieldRequired',
          type: 'text',
          label: 'Nested Field',
          required: true,
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Nested Collapsible',
      fields: [
        {
          name: 'outerText',
          type: 'text',
          label: 'Outer Text',
        },
        {
          type: 'collapsible',
          label: 'Inner Collapsible',
          fields: [
            {
              name: 'innerText',
              type: 'text',
              label: 'Inner Text',
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Collapsed By Default',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'collapsedField',
          type: 'text',
          label: 'Collapsed Field',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Collapsible With Description',
      admin: {
        description: 'This is a collapsible with a description.',
      },
      fields: [
        {
          name: 'describedField',
          type: 'text',
          label: 'Described Field',
        },
      ],
    },
  ],
}

export default CollapsibleFields
