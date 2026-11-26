import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { convertedVariantMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Allows only PNG uploads, but Sharp stores its variant as WebP, to check that `upload.mimeTypes`
 * limits only what a user uploads and not the format of a variant.
 */
export const ConvertedVariantMedia: CollectionConfig = {
  slug: convertedVariantMediaSlug,
  fields: [],
  upload: {
    mimeTypes: ['image/png'],
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
