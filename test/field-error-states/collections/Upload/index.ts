import type { CollectionConfig } from 'payload'

import path from 'path'

const Uploads: CollectionConfig = {
  slug: 'uploads',
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
      relationTo: 'uploads',
    },
    {
      name: 'richText',
      type: 'richText',
    },
  ],
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/field-error-states/collections/Upload/uploads'),
  },
}

export const uploadsDoc = {
  text: 'An upload here',
}

export default Uploads
