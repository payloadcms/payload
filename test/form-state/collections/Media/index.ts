import type { CollectionConfig } from 'payload'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const formMediaSlug = 'form-media'

export const FormMediaCollection: CollectionConfig = {
  slug: formMediaSlug,
  fields: [{ name: 'alt', type: 'text' }],
  upload: { staticDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'media') },
}
