import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminThumbnailFunctionSlug } from '../../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AdminThumbnailFunction: CollectionConfig = {
  slug: adminThumbnailFunctionSlug,
  upload: {
    staticDir: path.resolve(dirname, 'test/uploads/media'),
    adminThumbnail: () => 'https://payloadcms.com/images/universal-truth.jpg',
  },
  fields: [],
}
