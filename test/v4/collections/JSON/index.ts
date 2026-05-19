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
      label: 'JSON Required',
      required: true,
      admin: {
        description: 'This field is required',
      },
    },
    {
      name: 'jsonReadOnly',
      type: 'json',
      label: 'JSON Read Only',
      admin: {
        description: 'This field is read only',
        readOnly: true,
      },
      defaultValue: { example: 'read only' },
    },
    {
      name: 'jsonDisabled',
      type: 'json',
      label: 'JSON Disabled',
      admin: {
        description: 'This field is disabled',
        disabled: true,
      },
      defaultValue: { example: 'disabled' },
    },
  ],
}

export default JSONFields
