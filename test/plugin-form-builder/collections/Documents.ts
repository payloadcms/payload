import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { documentsSlug } from '../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Documents: CollectionConfig = {
  slug: documentsSlug,
  upload: {
    staticDir: path.resolve(dirname, './uploads-documents'),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
