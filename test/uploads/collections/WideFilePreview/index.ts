import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { wideFilePreviewSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const WideFilePreviewCollection: CollectionConfig = {
  slug: wideFilePreviewSlug,
  upload: {
    staticDir: path.resolve(dirname, '../../media'),
    admin: {
      components: {
        filePreview: '/collections/WideFilePreview/components/WideFilePreview.js#WideFilePreview',
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
