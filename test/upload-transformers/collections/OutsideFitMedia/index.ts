import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { outsideFitMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const OutsideFitMedia: CollectionConfig = {
  slug: outsideFitMediaSlug,
  fields: [],
  upload: {
    mimeTypes: ['image/*'],
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
