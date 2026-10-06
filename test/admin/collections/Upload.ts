import type { CollectionConfig } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { uploadCollectionSlug } from '../slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const UploadCollection: CollectionConfig = {
  slug: uploadCollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  upload: {
    adminThumbnail: () =>
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg',
    imageSizes: [
      {
        name: 'thumbnail',
        height: 100,
        width: 100,
      },
    ],
    staticDir: path.resolve(dirname, '../uploads'),
  },
  versions: false,
}
