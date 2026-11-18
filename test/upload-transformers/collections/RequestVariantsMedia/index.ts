import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { requestVariantsMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Its variants are registered by `requestVariantsTransformer`, which builds the crop and each size
 * when the file is requested. Sharp has no settings for it, so Sharp must not process its uploads.
 */
export const RequestVariantsMedia: CollectionConfig = {
  slug: requestVariantsMediaSlug,
  fields: [],
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
