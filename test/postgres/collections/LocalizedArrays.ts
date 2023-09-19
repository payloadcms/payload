import type { CollectionConfig } from '../../../src/collections/config/types'

export const LocalizedArrays: CollectionConfig = {
  slug: 'localized-arrays',
  fields: [
    {
      name: 'array',
      type: 'array',
      required: true,
      localized: true,
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
}
