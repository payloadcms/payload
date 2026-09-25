import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { mediaWithFocalPointSlug } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const MediaWithFocalPoint: CollectionConfig = {
  slug: mediaWithFocalPointSlug,
  fields: [],
  upload: {
    staticDir: path.resolve(dirname, '../media-with-focal-point'),
  },
  versions: false,
}
