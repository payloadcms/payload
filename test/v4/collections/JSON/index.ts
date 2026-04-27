import type { CollectionConfig } from 'payload'

import { jsonFieldsSlug } from '../../slugs.js'

const JSONFields: CollectionConfig = {
  slug: jsonFieldsSlug,
  fields: [
    {
      name: 'json',
      type: 'json',
      label: 'JSON Data',
      admin: {
        description: 'Enter valid JSON data',
      },
    },
    {
      name: 'jsonRequired',
      type: 'json',
      label: 'JSON Data',
      required: true,
      admin: {
        description: 'Enter valid JSON data',
      },
    },
  ],
}

export default JSONFields
