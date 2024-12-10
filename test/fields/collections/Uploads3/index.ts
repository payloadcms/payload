import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { uploads3Slug } from '../../slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const Uploads3: CollectionConfig = {
  slug: uploads3Slug,
  upload: {
    staticDir: path.resolve(dirname, './uploads3'),
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
    // {
    //   type: 'richText',
    //   name: 'richText',
    // },
  ],
}

export default Uploads3
