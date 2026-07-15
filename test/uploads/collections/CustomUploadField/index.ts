import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { customUploadFieldSlug } from '../../shared.js'

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
  versions: false,
}
