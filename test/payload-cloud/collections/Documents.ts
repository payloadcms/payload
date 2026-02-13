import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Documents: CollectionConfig = {
  slug: 'documents',
  access: {
    read: () => true,
    create: () => true,
  },
  upload: {
    // Allow non-image files like PDFs and text files
    staticDir: path.resolve(dirname, '../documents'),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
