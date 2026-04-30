import type { CollectionConfig } from 'payload'

import { arrayFieldsSlug } from '../../slugs.js'

const ArrayFields: CollectionConfig = {
  slug: arrayFieldsSlug,
  fields: [
    {
      name: 'rows',
      type: 'array',
      label: 'Rows',
      fields: [
        {
          name: 'nestedTextField',
          type: 'text',
          label: 'Nested Text Field',
        },
        {
          name: 'nestedSelect',
          type: 'select',
          label: 'Nested Select',
          options: [
            { label: 'Option 1', value: 'option-1' },
            { label: 'Option 2', value: 'option-2' },
            { label: 'Option 3', value: 'option-3' },
          ],
        },
      ],
    },
    {
      name: 'teamMembers',
      type: 'array',
      label: 'Team Members',
      minRows: 2,
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Name',
        },
      ],
    },
  ],
}

export default ArrayFields
