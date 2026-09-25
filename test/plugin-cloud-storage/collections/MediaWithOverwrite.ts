import type { CollectionConfig } from 'payload'

import { mediaWithOverwriteSlug } from '../shared.js'

export const MediaWithOverwrite: CollectionConfig = {
  slug: mediaWithOverwriteSlug,
  upload: {
    disableLocalStorage: true,
    resizeOptions: {
      position: 'center',
      width: 200,
      height: 200,
    },
    imageSizes: [
      {
        height: 400,
        width: 400,
        crop: 'center',
        name: 'square',
      },
      {
        width: 900,
        height: 450,
        crop: 'center',
        name: 'sixteenByNineMedium',
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
    },
  ],
  versions: false,
}
