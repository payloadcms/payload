import type { CollectionConfig } from 'payload'

import { adminOnly, authenticated } from '../../access/index.js'

export const mediaSlug = 'media'

export const Media: CollectionConfig = {
  slug: mediaSlug,
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: authenticated,
    update: adminOnly,
  },
  admin: {
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    useAsTitle: 'alt',
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
  ],
  upload: {
    crop: true,
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', height: 200, width: 200 },
      { name: 'medium', height: 800, width: 800 },
      { name: 'large', height: 1200, width: 1200 },
    ],
    mimeTypes: ['image/*'],
  },
  versions: false,
}
