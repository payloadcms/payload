import path from 'path'
import type { CollectionConfig } from 'payload/types'

const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: (): boolean => true,
  },
  admin: {
    useAsTitle: 'filename',
  },
  upload: {
    staticDir: path.resolve(__dirname, '../../uploads'),
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
      required: true,
    },
  ],
}

export default Media
