import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { mediaSlug } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: mediaSlug,
  upload: {
    staticDir: path.resolve(dirname, '../uploads'),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
