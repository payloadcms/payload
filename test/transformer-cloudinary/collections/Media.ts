import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { mediaSlug } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: mediaSlug,
  access: {
    // Ordinary reads are public; a dynamic transformation request requires an authenticated user.
    read: ({ req }) => (req.fileTransform ? Boolean(req.user) : true),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../media'),
  },
  versions: false,
}
