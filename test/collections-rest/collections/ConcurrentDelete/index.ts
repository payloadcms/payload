import type { CollectionConfig } from 'payload'

export const concurrentDeleteSlug = 'concurrent-delete'

let deleteCompletion: null | Promise<void> = null
let resolveDeleteCompletion: (() => void) | null = null
let deleteOrder = 0

export const resetConcurrentDeleteState = (): void => {
  deleteCompletion = null
  resolveDeleteCompletion = null
  deleteOrder = 0
}

export const ConcurrentDeleteCollection: CollectionConfig = {
  slug: concurrentDeleteSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  hooks: {
    afterDelete: [
      () => {
        resolveDeleteCompletion?.()
      },
    ],
    beforeDelete: [
      async () => {
        const order = deleteOrder++

        if (order === 0) {
          deleteCompletion = new Promise((resolve) => {
            resolveDeleteCompletion = resolve
          })

          return
        }

        await deleteCompletion!
      },
    ],
  },
  versions: false,
}
