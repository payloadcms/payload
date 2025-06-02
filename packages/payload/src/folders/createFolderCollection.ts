import type { CollectionConfig } from '../collections/config/types.js'

import { populateFolderDataEndpoint } from './endpoints/populateFolderData.js'
import { deleteSubfoldersBeforeDelete } from './hooks/deleteSubfoldersAfterDelete.js'
import { dissasociateAfterDelete } from './hooks/dissasociateAfterDelete.js'
import { reparentChildFolder } from './hooks/reparentChildFolder.js'

type CreateFolderCollectionArgs = {
  collectionSlugs: string[]
  debug?: boolean
  folderFieldName: string
  slug: string
}
export const createFolderCollection = ({
  slug,
  collectionSlugs,
  debug,
  folderFieldName,
}: CreateFolderCollectionArgs): CollectionConfig => ({
  slug,
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
      name: folderFieldName,
      type: 'relationship',
      admin: {
        hidden: !debug,
      },
      index: true,
      relationTo: slug,
    },
    {
      name: 'documentsAndFolders',
      type: 'join',
      admin: {
        hidden: !debug,
      },
      collection: [slug, ...collectionSlugs],
      hasMany: true,
      on: folderFieldName,
    },
  ],
  hooks: {
    afterChange: [
      reparentChildFolder({
        folderFieldName,
      }),
    ],
    afterDelete: [
      dissasociateAfterDelete({
        collectionSlugs,
        folderFieldName,
      }),
    ],
    beforeDelete: [deleteSubfoldersBeforeDelete({ folderFieldName, folderSlug: slug })],
  },
  labels: {
    plural: 'Folders',
    singular: 'Folder',
  },
  typescript: {
    interface: 'FolderInterface',
  },
})
