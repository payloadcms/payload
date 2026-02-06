import type { CollectionConfig } from 'payload'

import { customUploadFieldSlug } from '../../shared.js'

import { fileURLToPath } from 'url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const CustomUploadFieldCollection: CollectionConfig = {
  slug: customUploadFieldSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
  },
  admin: {
    components: {
      edit: {
        Upload: '/collections/CustomUploadField/components/CustomUpload/index.js#CustomUploadRSC',
      },
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
