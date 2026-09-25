import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { draftWithUploadCollectionSlug } from '../slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const DraftsWithUpload: CollectionConfig = {
  slug: draftWithUploadCollectionSlug,
  upload: {
    staticDir: path.resolve(dirname, './uploads-draft'),
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
