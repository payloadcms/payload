import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    afterOperation: [
      ({ operation, result }) => {
        if (operation === 'read') {
          return { ...result, touched: true }
        }

        return result
      },
    ],
  },
  fields: [],
}
