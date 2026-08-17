import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { transformerMediaSlug } from '../../shared.js'
import { transformerMediaHookCallCounts } from '../../transformerFixtures.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const TransformerMedia: CollectionConfig = {
  slug: transformerMediaSlug,
  access: {
    // Matches the design specification's documented pattern: ordinary reads are
    // public, but a dynamic transformation request requires an authenticated user.
    read: ({ req }) => (req.fileTransform ? Boolean(req.user) : true),
  },
  fields: [
    {
      name: 'prefix',
      type: 'text',
    },
  ],
  hooks: {
    afterChange: [
      () => {
        transformerMediaHookCallCounts.afterChange += 1
      },
    ],
    beforeChange: [
      ({ data }) => {
        transformerMediaHookCallCounts.beforeChange += 1
        return data
      },
    ],
    beforeDelete: [
      () => {
        transformerMediaHookCallCounts.beforeDelete += 1
      },
    ],
  },
  upload: {
    mimeTypes: ['application/pdf'],
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
