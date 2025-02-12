import type { CollectionConfig } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Uploads2: CollectionConfig = {
  slug: 'uploads-2',
  upload: {
    staticDir: path.resolve(dirname, 'uploads'),
    pasteURL: {
      allowList: [
        {
          protocol: 'https',
          hostname: 'some-example-website.com',
          pathname: '/images/*',
          port: '',
          search: '',
        },
      ],
    },
  },
  admin: {
    enableRichTextRelationship: false,
  },
  fields: [
    {
      name: 'prefix',
      type: 'text',
      required: true,
    },
    {
      type: 'text',
      name: 'title',
    },
  ],
}

export const uploadsDoc = {
  text: 'An upload here',
}
