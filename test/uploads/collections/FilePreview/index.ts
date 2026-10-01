import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { filePreviewSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const FilePreviewCollection: CollectionConfig = {
  slug: filePreviewSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    admin: {
      components: {
        filePreview:
          '/collections/FilePreview/components/FilePreview/index.js#FilePreviewComponent',
      },
    },
  },
  fields: [],
  versions: false,
}
