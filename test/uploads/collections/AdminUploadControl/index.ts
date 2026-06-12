import type { CollectionConfig } from 'payload'

import path from 'path'
import { isRSCEnabled } from 'payload/shared'
import { fileURLToPath } from 'url'

import { adminUploadControlSlug } from '../../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AdminUploadControl: CollectionConfig = {
  slug: adminUploadControlSlug,
  upload: {
    staticDir: path.resolve(dirname, 'test/uploads/media'),
    ...(isRSCEnabled()
      ? {
          admin: {
            components: {
              controls: [
                '/collections/AdminUploadControl/components/UploadControl/index.js#UploadControlRSC',
              ],
            },
          },
        }
      : {}),
  },
  fields: [],
  versions: false,
}
