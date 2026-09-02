import type { CollectionConfig } from 'payload'

import { postsWithSnakeCaseFieldsSlug } from '../shared.js'

export const PostsWithSnakeCaseFields: CollectionConfig = {
  slug: postsWithSnakeCaseFieldsSlug,
  labels: {
    singular: 'Posts With Snake Case Fields',
    plural: 'Posts With Snake Case Fields',
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'vat_number',
      type: 'text',
    },
    {
      name: 'billing_details',
      type: 'group',
      fields: [
        {
          name: 'vat_number',
          type: 'text',
        },
      ],
    },
    {
      name: 'line_items',
      type: 'array',
      fields: [
        {
          name: 'item_code',
          type: 'text',
        },
      ],
    },
    {
      name: 'localized_note',
      type: 'text',
      localized: true,
    },
  ],
}
