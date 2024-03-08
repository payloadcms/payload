import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: () => false,
    read: () => true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
}
