import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminUploadControlSlug } from '../../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AdminUploadControl: CollectionConfig = {
  slug: adminUploadControlSlug,
  upload: {
    staticDir: path.resolve(dirname, 'test/uploads/media'),
    admin: {
      components: {
        controls: [
          '/collections/AdminUploadControl/components/UploadControl/index.js#UploadControlRSC',
        ],
      },
    },
  },
  fields: [],
}
