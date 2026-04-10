import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { media2CollectionSlug } from '../slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media2: CollectionConfig = {
  fields: [],
  slug: media2CollectionSlug,
  upload: {
    staticDir: path.resolve(dirname, './uploads2'),
  },
}
