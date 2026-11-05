import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
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
