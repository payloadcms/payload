import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { requestVariantsMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Its variants are registered by `requestVariantsTransformer`, which builds the crop and each size
 * of a PNG when the file is requested. Sharp has no settings for it, so Sharp processes only the
 * uploads that this transformer cannot build.
 */
export const RequestVariantsMedia: CollectionConfig = {
  slug: requestVariantsMediaSlug,
  fields: [],
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
