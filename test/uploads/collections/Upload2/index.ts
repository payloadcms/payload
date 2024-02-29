import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

export const Uploads2: CollectionConfig = {
  slug: 'uploads-2',
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/uploads/collections/Upload2/uploads'),
  },
  admin: {
    enableRichTextRelationship: false,
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
