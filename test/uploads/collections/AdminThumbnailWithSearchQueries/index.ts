import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminThumbnailWithSearchQueries } from '../../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AdminThumbnailWithSearchQueries: CollectionConfig = {
  slug: adminThumbnailWithSearchQueries,
  hooks: {
    afterRead: [
      ({ doc }) => {
        return {
          ...doc,
          // Test that URLs with additional queries are handled correctly
          thumbnailURL: `/_next/image?url=${doc.url}&w=384&q=5`,
        }
      },
    ],
  },
  upload: {
    staticDir: path.resolve(dirname, 'test/uploads/media'),
  },
  fields: [],
}
