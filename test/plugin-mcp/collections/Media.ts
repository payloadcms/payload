import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
  upload: {
    pasteURL: {
      allowList: [{ hostname: '127.0.0.1', protocol: 'http' }],
    },
  },
  versions: false,
}
