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
