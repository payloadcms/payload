import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { variantMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Its upload-time variants are configured on a Sharp instance registered after
 * the dynamic-only ones, so the bridge must be chosen by collection, not by order.
 */
export const VariantMedia: CollectionConfig = {
  slug: variantMediaSlug,
  fields: [],
  upload: {
    mimeTypes: ['image/*'],
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
