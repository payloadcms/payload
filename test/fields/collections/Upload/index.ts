import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { uploadsSlug } from '../../slugs'

const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/fields/collections/Upload/uploads'),
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
