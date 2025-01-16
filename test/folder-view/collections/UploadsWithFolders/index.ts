import type { CollectionConfig } from 'payload'

export const UploadsWithFolders: CollectionConfig = {
  slug: 'media',
  upload: true,
  admin: {
    enableFolders: {
      debug: true,
    },
  },
  fields: [],
}
