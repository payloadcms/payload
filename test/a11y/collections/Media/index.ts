import type { CollectionConfig } from 'payload'

export const mediaSlug = 'media'

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  access: {
    create: () => true,
    read: () => true,
  },
  fields: [
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
