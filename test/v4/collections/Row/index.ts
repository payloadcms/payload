import type { CollectionConfig } from 'payload'

import { rowFieldsSlug } from '../../slugs.js'

const RowFields: CollectionConfig = {
  slug: rowFieldsSlug,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          label: 'Email',
        },
        {
          name: 'password',
          type: 'text',
          label: 'Password',
        },
      ],
    },
  ],
}

export default RowFields
