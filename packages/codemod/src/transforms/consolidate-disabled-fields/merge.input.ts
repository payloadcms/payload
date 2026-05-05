import type { CollectionConfig } from 'payload'

export const cfg: CollectionConfig = {
  slug: 'merge',
  fields: [
    {
      name: 'a',
      type: 'text',
      admin: {
        disabled: { edit: true },
        disableListColumn: true,
      },
    },
  ],
}
