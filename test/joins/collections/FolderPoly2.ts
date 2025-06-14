import type { CollectionConfig } from 'payload'

export const FolderPoly2: CollectionConfig = {
  slug: 'folderPoly2',
  fields: [
    {
      name: 'commonTitle',
      type: 'text',
    },
    {
      name: 'folderPoly2Title',
      type: 'text',
    },
  ],
  folders: true,
}
