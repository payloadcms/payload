import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeOperation: [
      ({ args, operation }) => {
        if (operation === 'read') {
          return args
        }

        return args
      },
    ],
  },
  fields: [],
}
