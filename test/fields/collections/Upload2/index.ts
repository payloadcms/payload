import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { uploads2Slug } from '../../slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const Uploads2: CollectionConfig = {
  slug: uploads2Slug,
  upload: {
    staticDir: path.resolve(dirname, './uploads2'),
  },
  labels: {
    singular: 'Upload 2',
    plural: 'Uploads 2',
  },
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'upload',
      name: 'media',
      relationTo: uploads2Slug,
    },
  ],
}

export default Uploads2
