import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { uploads2Slug, uploads3Slug, uploadsSlug } from '../../slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Uploads: CollectionConfig = {
  slug: uploadsSlug,
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
      relationTo: uploadsSlug,
    },
    // {
    //   name: 'richText',
    //   type: 'richText',
    // },
  ],
  upload: {
    staticDir: path.resolve(dirname, './uploads'),
  },
}

export const Uploads2: CollectionConfig = {
  ...Uploads,
  slug: uploads2Slug,
}

export const Uploads3: CollectionConfig = {
  ...Uploads,
  slug: uploads3Slug,
  fields: [
    ...Uploads.fields,
    {
      name: 'altText',
      type: 'text',
    },
  ],
}
