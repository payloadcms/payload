import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { uploadsSlug } from '../../slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'media',
      type: 'upload',
      filterOptions: {
        mimeType: {
          equals: 'image/png',
        },
      },
      relationTo: uploadsSlug,
    },
    // {
    //   name: 'richText',
    //   type: 'richText',
    // },
  ],
  upload: {
    staticDir: path.resolve(dirname, './uploads'),
  },
}

export default Uploads
