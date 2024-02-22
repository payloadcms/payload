import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const mediaSlug = 'media'

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  // upload: {
  //   staticDir: path.resolve(__dirname, './media'),
  // },
  upload: true,
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [],
}
