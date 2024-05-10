import type { CollectionConfig } from 'payload/dist/collections/config/types.js'

import { arrayFieldsSlug } from '../../fields/slugs.js'

export const ArrayFields: CollectionConfig = {
  slug: arrayFieldsSlug,
  admin: {
    enableRichTextLink: false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'localized',
      type: 'array',
      fields: [
        {
          name: 'text',
          required: true,
          type: 'text',
        },
      ],
      localized: true,
      required: true,
    },
  ],
  // versions: true,
}
