import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const Uploads2: CollectionConfig = {
  slug: 'uploads-2',
  upload: {
    staticDir: path.resolve(__dirname, './uploads'),
  },
  admin: {
    enableRichTextRelationship: false,
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'text',
      name: 'title',
    },
  ],
}

export const uploadsDoc = {
  text: 'An upload here',
}

export default Uploads2
