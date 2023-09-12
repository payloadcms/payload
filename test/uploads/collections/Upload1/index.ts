import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { createSlate } from '../../../../packages/richtext-slate/src'

export const Uploads1: CollectionConfig = {
  slug: 'uploads-1',
  upload: {
    staticDir: path.resolve(__dirname, './uploads'),
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
      adapter: createSlate({}),
    },
  ],
}

export const uploadsDoc = {
  text: 'An upload here',
}
