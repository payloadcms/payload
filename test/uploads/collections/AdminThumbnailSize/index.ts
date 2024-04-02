import type { CollectionConfig } from 'payload/types'

import path from 'path'

import { adminThumbnailSizeSlug } from '../../shared.js'

export const AdminThumbnailSize: CollectionConfig = {
  slug: adminThumbnailSizeSlug,
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/uploads/media'),
    adminThumbnail: 'small',
    imageSizes: [
      {
        name: 'small',
        width: 100,
        height: 100,
      },
      {
        name: 'medium',
        width: 200,
        height: 200,
      },
    ],
  },
  fields: [],
}
