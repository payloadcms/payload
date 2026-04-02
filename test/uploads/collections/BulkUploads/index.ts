import type { CollectionConfig } from 'payload'

import { bulkUploadsSlug } from '../../shared.js'

import { fileURLToPath } from 'url'
import path from 'path'
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
}
