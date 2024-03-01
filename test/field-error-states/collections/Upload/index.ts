import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

const Uploads: CollectionConfig = {
  slug: 'uploads',
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/field-error-states/collections/Upload/uploads'),
  },
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'upload',
      name: 'media',
      relationTo: 'uploads',
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

export const uploadsDoc = {
  text: 'An upload here',
}

export default Uploads
