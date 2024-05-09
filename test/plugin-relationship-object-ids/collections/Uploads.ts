import type { CollectionConfig } from 'payload/types'

import path from 'path'
import { fileURLToPath } from 'url'

const filePath = fileURLToPath(import.meta.url)
const dirname = path.dirname(filePath)

export const Uploads: CollectionConfig = {
  slug: 'uploads',
  fields: [],
  upload: {
    staticDir: path.resolve(dirname, '../media'),
  },
}
