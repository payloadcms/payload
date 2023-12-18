import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    disableLocalStorage: false, // don't save me
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
}
