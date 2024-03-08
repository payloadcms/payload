import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types.js'

export const mediaSlug = 'media'

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  upload: {
    crop: true,
    focalPoint: true,
    imageSizes: [
      {
        name: 'thumbnail',
        width: 200,
        height: 200,
      },
      {
        name: 'medium',
        width: 800,
        height: 800,
      },
      {
        name: 'large',
        width: 1200,
        height: 1200,
      },
    ],
  },
  access: {
    read: () => true,
    create: () => true,
  },
  fields: [],
}
