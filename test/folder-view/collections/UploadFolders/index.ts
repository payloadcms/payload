import type { CollectionConfig } from 'payload'

export const FolderUploads: CollectionConfig = {
  slug: 'media',
  upload: true,
  admin: {
    enableFolders: {
      debug: true,
    },
  },
  fields: [],
}
