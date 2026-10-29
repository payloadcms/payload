import type { CollectionConfig } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const uploadsSlug = 'uploads'

export const UploadsCollection: CollectionConfig = {
  slug: uploadsSlug,
  fields: [{ name: 'alt', type: 'text' }],
  upload: { staticDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'media') },
}
