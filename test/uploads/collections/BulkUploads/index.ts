import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { bulkUploadsSlug } from '../../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const BulkUploadsCollection: CollectionConfig = {
  slug: bulkUploadsSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'text',
      name: 'title',
      required: true,
    },
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: ['simple-relationship'],
    },
  ],
  versions: false,
}
