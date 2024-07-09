import path from 'path'

import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { uploadsSlug } from '../../slugs'

const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  upload: {
    allowRemoteUpload: true,
    staticDir: path.resolve(__dirname, './uploads'),
    // imageSizes: [
    //   {
    //     name: 'squareSmall',
    //     width: 480,
    //     height: 480,
    //     position: 'centre',
    //     withoutEnlargement: false,
    //   },
    //   {
    //     name: 'undefinedHeight',
    //     width: 300,
    //     height: undefined,
    //   },
    //   {
    //     name: 'undefinedWidth',
    //     width: undefined,
    //     height: 300,
    //   },
    //   {
    //     name: 'undefinedAll',
    //     width: undefined,
    //     height: undefined,
    //     fit: 'fill',
    //   },
    // ],
    // focalPoint: false,
  },
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'upload',
      name: 'media',
      relationTo: uploadsSlug,
      filterOptions: {
        mimeType: {
          equals: 'image/png',
        },
      },
    },
    {
      type: 'richText',
      name: 'richText',
    },
  ],
}

export default Uploads
