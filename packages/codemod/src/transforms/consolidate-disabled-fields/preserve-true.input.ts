import type { CollectionConfig } from 'payload'

export const cfg: CollectionConfig = {
  slug: 'preserve',
  fields: [
    {
      name: 'a',
      type: 'text',
      admin: {
        disableBulkEdit: true,
        disabled: true,
        disableListColumn: true,
      },
    },
  ],
}
