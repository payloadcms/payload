import type { CollectionConfig } from 'payload'

import { customFieldsSlug } from '../../slugs.js'

export const CustomFields: CollectionConfig = {
  slug: customFieldsSlug,
  fields: [
    {
      name: 'customSelectField',
      type: 'text',
      admin: {
        components: {
          Field: './components/CustomSelect.js',
        },
      },
    },
  ],
}
