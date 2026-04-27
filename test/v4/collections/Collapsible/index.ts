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
  ],
}

export default CollapsibleFields
