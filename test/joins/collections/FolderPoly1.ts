import type { CollectionConfig } from 'payload'

export const FolderPoly1: CollectionConfig = {
  slug: 'folderPoly1',
  fields: [
    {
      name: 'commonTitle',
      type: 'text',
    },
    {
      name: 'folderPoly1Title',
      type: 'text',
    },
  ],
  folders: true,
}
