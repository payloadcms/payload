import type { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
    },
  ],
}
