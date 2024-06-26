import type { CollectionConfig } from 'payload'

export const afterOperationSlug = 'afterOperation'

export const AfterOperationCollection: CollectionConfig = {
  slug: afterOperationSlug,
  hooks: {
    // beforeRead: [(operation) => operation.doc],
    afterOperation: [
      ({ result, operation }) => {
        if (operation === 'create') {
          if ('docs' in result) {
            return {
              ...result,
              docs: result.docs?.map((doc) => ({
                ...doc,
                title: 'Title created',
              })),
            }
          }

          return { ...result, title: 'Title created' }
        }

        if (operation === 'find') {
          // Only modify the first doc for `find` operations.
          // This is so that we can test against the other operations
          return {
            ...result,
            docs: result.docs?.map((doc, index) =>
              index === 0
                ? {
                    ...doc,
                    title: 'Title read',
                  }
                : doc,
            ),
          }
        }

        if (operation === 'findByID') {
          return { ...result, title: 'Title read' }
        }

        if (operation === 'update') {
          if ('docs' in result) {
            return {
              ...result,
              docs: result.docs?.map((doc) => ({
                ...doc,
                title: 'Title updated',
              })),
            }
          }
        }

        if (operation === 'updateByID') {
          return { ...result, title: 'Title updated' }
        }

        return result
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}
