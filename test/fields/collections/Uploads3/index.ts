import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { uploads3Slug } from '../../slugs'

const Uploads3: CollectionConfig = {
  slug: uploads3Slug,
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
      relationTo: uploads3Slug,
    },
    {
      type: 'richText',
      name: 'richText',
    },
  ],
}

export default Uploads3
