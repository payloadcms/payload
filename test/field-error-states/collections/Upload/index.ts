import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { createSlate } from '../../../../packages/richtext-slate/src'

const Uploads: CollectionConfig = {
  slug: 'uploads',
  upload: {
    staticDir: path.resolve(__dirname, './uploads'),
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
      editor: createSlate({}),
    },
  ],
}

export const uploadsDoc = {
  text: 'An upload here',
}

export default Uploads
