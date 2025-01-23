import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Uploads1: CollectionConfig = {
  slug: 'uploads-1',
  upload: {
    staticDir: path.resolve(dirname, 'uploads'),
    pasteURL: {
      allowList: [
        {
          protocol: 'http',
          hostname: 'localhost',
          port: '4000',
        },
      ],
    },
  },
  fields: [
    {
      type: 'upload',
      name: 'hasManyUpload',
      relationTo: 'uploads-2',
      filterOptions: {
        mimeType: {
          equals: 'image/png',
        },
      },
      hasMany: true,
    },
    {
      type: 'upload',
      name: 'singleUpload',
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
