import type { CollectionConfig } from 'payload/types'

export const CategoriesCollection: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
  // versions: {
  //   drafts: true,
  // },
}
