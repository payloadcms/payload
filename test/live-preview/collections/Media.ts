import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: true,
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    // {
    //   name: 'caption',
    //   type: 'richText',
    // },
  ],
}
