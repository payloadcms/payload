import type { CollectionConfig } from 'payload/types'

import { slateEditor } from '@payloadcms/richtext-slate'
import path from 'path'

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
      editor: slateEditor({
        admin: {
          elements: ['link'],
        },
      }),
    },
  ],
  upload: {
    staticDir: path.resolve(__dirname, '../../../media'),
  },
}
