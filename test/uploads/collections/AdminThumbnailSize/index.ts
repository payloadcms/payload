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
  },
  fields: [],
  versions: false,
}
