import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    afterOperation: [
      ({ operation: op, result }) => {
        if (op !== 'read' && result) {
          return result
        }

        return result
      },
    ],
  },
  fields: [],
}
