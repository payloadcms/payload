import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminThumbnailSizeSlug } from '../../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AdminThumbnailSize: CollectionConfig = {
  slug: adminThumbnailSizeSlug,
  upload: {
    staticDir: path.resolve(dirname, 'test/uploads/media'),
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
