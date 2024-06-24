import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { mediaSlug } from '../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: mediaSlug,
  upload: {
    staticDir: path.resolve(dirname, '../media'),
  },
  fields: [
    {
      type: 'upload',
      name: 'media',
      relationTo: 'media',
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
