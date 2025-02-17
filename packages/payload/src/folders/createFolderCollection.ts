import type { CollectionConfig } from '../collections/config/types.js'

import { foldersSlug, parentFolderFieldName } from './constants.js'
import { populateFolderDataEndpoint } from './endpoints/populateFolderData.js'
import { deleteSubfoldersAfterDelete } from './hooks/deleteSubfoldersAfterDelete.js'
import { dissasociateAfterDelete } from './hooks/dissasociateAfterDelete.js'
import { ensureParentFolder } from './hooks/ensureParentFolder.js'

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
      name: 'isRoot',
      type: 'checkbox',
      admin: {
        hidden: !debug,
      },
      defaultValue: false,
      index: true,
    },
    {
      name: 'documentsAndFolders',
      type: 'join',
      admin: {
        hidden: !debug,
      },
      collection: '_folders',
      hasMany: true,
      on: parentFolderFieldName,
    },
  ],
  hooks: {
    afterDelete: [
      dissasociateAfterDelete({
        collectionSlugs,
        parentFolderFieldName,
      }),
      deleteSubfoldersAfterDelete({ parentFolderFieldName }),
    ],
    beforeChange: [ensureParentFolder],
  },
  labels: {
    plural: 'Folders',
    singular: 'Folder',
  },
  typescript: {
    interface: 'FolderInterface',
  },
})
