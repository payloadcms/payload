import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    enableFolders: {
      debug: true,
    },
  },
  upload: true,
  fields: [],
}
