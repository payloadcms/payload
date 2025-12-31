import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { adminBulkUploadControlSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AdminBulkUploadControl: CollectionConfig = {
  slug: adminBulkUploadControlSlug,
  fields: [],
  upload: {
    admin: {
      components: {
        bulkControls: [
          '/collections/AdminBulkUploadControl/components/BulkUploadControl/index.js#BulkUploadControlRSC',
        ],
      },
    },
    staticDir: path.resolve(dirname, 'test/uploads/media'),
  },
}
