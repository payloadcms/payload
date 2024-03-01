import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { RegisterAdminThumbnailFn } from './RegisterThumbnailFn'

export const AdminThumbnailCol: CollectionConfig = {
  slug: 'admin-thumbnail',
  upload: {
    staticDir: path.resolve(process.cwd(), 'test/uploads/media'),
    adminThumbnail: RegisterAdminThumbnailFn,
  },
  fields: [],
}

export default AdminThumbnailCol
