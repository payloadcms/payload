import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const Uploads1: CollectionConfig = {
  slug: 'uploads-1',
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/uploads/collections/Upload1/uploads'),
  },
  fields: [
    {
      type: 'upload',
      name: 'media',
      relationTo: 'uploads-2',
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
