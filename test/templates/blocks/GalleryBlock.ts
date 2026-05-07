import type { Block } from 'payload'

import { galleryBlockSlug } from '../slugs.js'

export const GalleryBlock: Block = {
  slug: galleryBlockSlug,
  interfaceName: 'GalleryBlock',
  fields: [
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'alt',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
