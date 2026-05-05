import type { CollectionConfig } from 'payload'

export const cfg: CollectionConfig = {
  slug: 'merge',
  fields: [
    {
      name: 'a',
      type: 'text',
      admin: {
        disabled: { column: true, edit: true }
      },
    },
  ],
}
