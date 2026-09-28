import type { CollectionConfig } from 'payload'

import { contentAccess } from '../../access.js'

export const mediaSlug = 'media'

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  access: contentAccess,
  admin: {
    group: 'Content',
    // useAsTitle: 'alt',
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'textarea', localized: true },
    { name: 'credit', type: 'text' },
  ],
  upload: {
    adminThumbnail: 'thumbnail',
    crop: true,
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        fit: 'cover',
        height: 300,
        width: 400,
      },
      {
        name: 'medium',
        height: 800,
        width: 800,
      },
      {
        name: 'large',
        height: 1200,
        width: 1200,
      },
    ],
    mimeTypes: ['image/*', 'application/pdf'],
  },
  versions: false,
}
