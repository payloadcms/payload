import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

export const FolderPoly1: CollectionConfig = {
  slug: 'folderPoly1',
  fields: [
    {
      name: 'folderPoly1Title',
      type: 'text',
    },
    createFolderField({ relationTo: 'folders' }),
  ],
}
