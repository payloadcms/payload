import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { createSlate } from '../../../../packages/richtext-slate/src'

const Uploads3: CollectionConfig = {
  slug: 'uploads3',
  upload: {
    staticDir: path.resolve(__dirname, './uploads3'),
  },
  labels: {
    singular: 'Upload 3',
    plural: 'Uploads 3',
  },
  admin: {
    enableRichTextRelationship: false,
  },
  fields: [
    {
      type: 'upload',
      name: 'media',
      relationTo: 'uploads3',
    },
    {
      type: 'richText',
      name: 'richText',
      editor: createSlate({}),
    },
  ],
}

export const uploadsDoc = {
  text: 'An upload here',
}

export default Uploads3
