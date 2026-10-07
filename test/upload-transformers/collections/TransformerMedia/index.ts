import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { transformerMediaSlug } from '../../shared.js'
import { fileRequestEvents, transformerMediaHookCallCounts } from '../../transformerFixtures.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const TransformerMedia: CollectionConfig = {
  slug: transformerMediaSlug,
  access: {
    // Ordinary reads are public; a dynamic transformation request requires an authenticated user.
    // An `x-deny-plain-read` or `x-deny-transform-read` header denies that access mode outright.
    read: ({ req }) => {
      const accessMode = req.fileTransform ? 'transform' : 'plain'

      fileRequestEvents.push(`access:${accessMode}`)

      if (req.headers.get(`x-deny-${accessMode}-read`)) {
        return false
      }

      return req.fileTransform ? Boolean(req.user) : true
    },
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
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
