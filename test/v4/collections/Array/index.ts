import type { CollectionConfig } from 'payload'

import { arrayFieldsSlug } from '../../slugs.js'

const ArrayFields: CollectionConfig = {
  slug: arrayFieldsSlug,
  fields: [
    {
      name: 'arrayField',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      name: 'arrayWithRequiredField',
      type: 'array',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'minRows',
      type: 'array',
      label: 'With Min Rows',
      minRows: 2,
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name',
        },
      ],
    },
    {
      name: 'nestedArray',
      type: 'array',
      label: 'Nested Array',
      fields: [
        {
          name: 'nestedArrayField',
          type: 'array',
          label: 'Nested Array Field',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'arrayWithMaxRows',
      type: 'array',
      maxRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    {
      name: 'arrayWithDescription',
      type: 'array',
      admin: {
        description: 'Add items to this array field.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
  ],
}

export default ArrayFields
