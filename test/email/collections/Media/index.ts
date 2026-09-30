import type { SharpCollectionConfig } from '@payloadcms/transformer-sharp'
import type { CollectionConfig } from 'payload'

import { getPayload } from 'payload'

export const mediaSlug = 'media'

export const MediaCollection: CollectionConfig = {
  slug: mediaSlug,
  access: {
    create: () => true,
    read: () => true,
  },
  fields: [],
  upload: true,
  versions: false,
}

export const mediaSharpOptions: SharpCollectionConfig = {
  crop: true,
  focalPoint: true,
  variants: [
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
}
