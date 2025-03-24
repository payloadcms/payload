import type { CollectionConfig } from '../collections/config/types.js'

import { foldersSlug, parentFolderFieldName } from './constants.js'
import { populateFolderDataEndpoint } from './endpoints/populateFolderData.js'
import { createBaseFolderSearchField } from './fields/folderSearch.js'
import { deleteSubfoldersAfterDelete } from './hooks/deleteSubfoldersAfterDelete.js'
import { dissasociateAfterDelete } from './hooks/dissasociateAfterDelete.js'

type CreateFolderCollectionArgs = {
  collectionSlugs: string[]
  debug?: boolean
}
export const createFolderCollection = ({
  collectionSlugs,
  debug,
}: CreateFolderCollectionArgs): CollectionConfig => ({
  slug: foldersSlug,
  admin: {
    hidden: !debug,
    useAsTitle: 'name',
  },
  endpoints: [populateFolderDataEndpoint],
  fields: [
    {
      name: 'name',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: parentFolderFieldName,
      type: 'relationship',
      admin: {
        hidden: !debug,
      },
      index: true,
      relationTo: foldersSlug,
    },
    {
      name: 'documentsAndFolders',
      type: 'join',
      admin: {
        hidden: !debug,
      },
      collection: ['_folders', ...collectionSlugs],
      hasMany: true,
      on: parentFolderFieldName,
    },
    createBaseFolderSearchField({ debug, useAsTitle: 'name' }),
  ],
  hooks: {
    afterDelete: [
      dissasociateAfterDelete({
        collectionSlugs,
        parentFolderFieldName,
      }),
      deleteSubfoldersAfterDelete({ parentFolderFieldName }),
    ],
  },
  labels: {
    plural: 'Folders',
    singular: 'Folder',
  },
  typescript: {
    interface: 'FolderInterface',
  },
})
