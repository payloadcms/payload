import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

export const FolderPoly2: CollectionConfig = {
  slug: 'folderPoly2',
  fields: [
    {
      name: 'folderPoly2Title',
      type: 'text',
    },
    createFolderField({ relationTo: 'folders' }),
  ],
}
