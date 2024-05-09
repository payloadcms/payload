import type { CollectionConfig } from 'payload/types'

import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { LinkFeature } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features({ defaultFeatures }) {
          return [LinkFeature({ enabledCollections: ['pages'] })]
        },
      }),
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
  },
}
