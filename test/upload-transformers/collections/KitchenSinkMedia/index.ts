import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { kitchenSinkMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const KitchenSinkMedia: CollectionConfig = {
  slug: kitchenSinkMediaSlug,
  fields: [],
  upload: {
    mimeTypes: ['image/*'],
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
