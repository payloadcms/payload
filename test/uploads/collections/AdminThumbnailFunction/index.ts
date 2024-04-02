import type { CollectionConfig } from 'payload/types'

import path from 'path'

import { adminThumbnailFunctionSlug } from '../../shared.js'

export const AdminThumbnailFunction: CollectionConfig = {
  slug: adminThumbnailFunctionSlug,
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/uploads/media'),
    adminThumbnail: () => 'https://payloadcms.com/images/universal-truth.jpg',
  },
  fields: [],
}
