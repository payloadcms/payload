import type { CollectionConfig } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'

import { resizePreviewMediaSlug } from '../../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const ResizePreviewMedia: CollectionConfig = {
  slug: resizePreviewMediaSlug,
  access: {
    // Ordinary reads are public so Cloudinary can fetch the source; a dynamic
    // transformation request requires an authenticated user.
    read: ({ req }) => (req.fileTransform ? Boolean(req.user) : true),
  },
  fields: [
    {
      name: 'resizePreview',
      type: 'ui',
      admin: {
        components: {
          Field:
            '/collections/ResizePreviewMedia/components/ResizePreview/index.client.js#ResizePreviewField',
        },
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    staticDir: path.resolve(dirname, '../../media'),
  },
  versions: false,
}
