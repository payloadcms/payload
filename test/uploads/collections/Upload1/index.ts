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
          in: ['image/png', 'application/pdf'],
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
      type: 'upload',
      name: 'hasManyThumbnailUpload',
      relationTo: 'admin-thumbnail-size',
      hasMany: true,
    },
    {
      type: 'upload',
      name: 'singleThumbnailUpload',
      relationTo: 'admin-thumbnail-size',
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
