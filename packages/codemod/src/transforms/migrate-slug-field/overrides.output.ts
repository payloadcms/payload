import type { CollectionConfig, TextField } from 'payload'

import { slugField } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    slugField({
      overrides: (field) => {
        ;(field.fields[1] as TextField).label = 'Custom'
        return field
      },
    }),
  ],
}
