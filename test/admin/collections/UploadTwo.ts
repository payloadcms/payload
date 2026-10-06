import type { CollectionConfig } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { uploadTwoCollectionSlug } from '../slugs.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export const UploadTwoCollection: CollectionConfig = {
  slug: uploadTwoCollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../uploads-two'),
  },
  versions: false,
}
