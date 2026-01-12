import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { mediaCollectionSlug } from '../slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  fields: [],
  slug: mediaCollectionSlug,
  upload: {
    staticDir: path.resolve(dirname, './uploads'),
  },
}
