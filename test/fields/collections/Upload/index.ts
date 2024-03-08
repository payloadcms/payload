import path from 'path'
import { fileURLToPath } from 'url'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

import { uploadsSlug } from '../../slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  upload: {
    staticDir: path.resolve(dirname, './uploads'),
  },
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'upload',
      name: 'media',
      relationTo: uploadsSlug,
      filterOptions: {
        mimeType: {
          equals: 'image/png',
        },
      },
    },
    {
      type: 'richText',
      name: 'richText',
    },
  ],
}

export default Uploads
