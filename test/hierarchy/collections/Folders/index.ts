import { createFoldersCollection } from 'payload'

import { foldersSlug } from '../../shared.js'

export const Folders = createFoldersCollection({
  slug: foldersSlug,
  useAsTitle: 'name',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'folderSlug', type: 'text' },
  ],
  hierarchy: {
    collectionSpecific: { fieldName: 'folderType' },
    joinField: { name: 'documentsAndFolders' },
    parentFieldName: 'folder',
  },
})
