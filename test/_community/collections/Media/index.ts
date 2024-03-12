import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

export const mediaSlug = 'media'

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  access: {
    create: () => true,
    read: () => true,
  },
  fields: [],
  upload: {
    crop: true,
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        height: 200,
        width: 200,
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
  },
}
