import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { noFilesRequiredSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const NoFilesRequired: CollectionConfig = {
  slug: noFilesRequiredSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    filesRequiredOnCreate: false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
