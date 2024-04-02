import type { CollectionConfig } from 'payload/types'

import { fileURLToPath } from 'node:url'
import path from 'path'

import { RegisterAdminThumbnailFn } from './RegisterThumbnailFn.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const AdminThumbnailCol: CollectionConfig = {
  slug: 'admin-thumbnail',
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    adminThumbnail: RegisterAdminThumbnailFn,
  },
  fields: [],
}
