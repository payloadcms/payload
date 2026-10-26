import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

export const mediaSlug = 'media'

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  access: {
    create: () => true,
    read: () => true,
  },
  fields: [
    createFolderField({ relationTo: 'payload-folders' }),
    {
      name: 'alt',
      type: 'text',
      defaultValue: 'Accessibility test image',
      required: true,
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
  },
  versions: false,
}
