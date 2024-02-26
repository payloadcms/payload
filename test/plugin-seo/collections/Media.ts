import path from 'path'

import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { mediaSlug } from '../shared'

export const Media: CollectionConfig = {
  slug: mediaSlug,
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/plugin-seo/media'),
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
