import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { uploads2Slug } from '../../slugs'

const Uploads2: CollectionConfig = {
  slug: uploads2Slug,
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/fields/collections/Upload2/uploads2'),
  },
  labels: {
    singular: 'Upload 2',
    plural: 'Uploads 2',
  },
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'upload',
      name: 'media',
      relationTo: uploads2Slug,
    },
  ],
}

export default Uploads2
