import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { fileMimeTypeSlug } from '../../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const FileMimeType: CollectionConfig = {
  slug: fileMimeTypeSlug,
  admin: {
    useAsTitle: 'title',
  },
  upload: {
    mimeTypes: ['application/pdf'],
    staticDir: path.resolve(dirname, '../../media'),
  },
  fields: [
    {
      type: 'text',
      name: 'title',
    },
  ],
}
