import path from 'path'
import { CollectionConfig } from 'payload/types'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'label',
  },
  upload: {
    staticDir: path.resolve(__dirname, './uploads'),
  },
  fields: [
    {
      name: 'label',
      type: 'text',
    },
  ],
}
