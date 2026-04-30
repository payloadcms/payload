import type { CollectionConfig } from 'payload'

import { selectFieldsSlug } from '../../slugs.js'

const SelectFields: CollectionConfig = {
  slug: selectFieldsSlug,
  fields: [
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      admin: {
        description: 'The current publication status of this post',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'statusRequired',
      type: 'select',
      label: 'Status',
      required: true,
      admin: {
        description: 'The current publication status of this post',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
}

export default SelectFields
