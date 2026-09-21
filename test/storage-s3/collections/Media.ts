import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: ({ req }) => Boolean(req.user) && req.headers.get('x-disallow-create') !== 'true',
    update: ({ req }) => Boolean(req.user) && req.headers.get('x-disallow-update') !== 'true',
  },
  upload: {
    modifyResponseHeaders({ headers }) {
      headers.set('X-Universal-Truth', 'Set')
    },
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
