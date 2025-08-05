import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { anyImagesSlug } from '../../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AnyImageTypeCollection: CollectionConfig = {
  slug: anyImagesSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../with-any-image-type'),
    mimeTypes: ['image/*'],
  },
  admin: {
    enableRichTextRelationship: false,
  },
  fields: [],
}
