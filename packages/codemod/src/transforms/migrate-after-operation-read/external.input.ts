import type { CollectionConfig } from 'payload'

import { myAfterOperation } from './myAfterOperation.js'

export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    afterOperation: [myAfterOperation],
  },
  fields: [],
}
