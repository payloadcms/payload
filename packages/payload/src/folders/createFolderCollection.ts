import type { CollectionConfig } from '../collections/config/types.js'
import type { Option } from '../fields/config/types.js'

import { deleteSubfoldersBeforeDelete } from './hooks/deleteSubfoldersAfterDelete.js'
import { dissasociateAfterDelete } from './hooks/dissasociateAfterDelete.js'
import { reparentChildFolder } from './hooks/reparentChildFolder.js'

type CreateFolderCollectionArgs = {
  debug?: boolean
  folderEnabledCollections: CollectionConfig[]
  folderFieldName: string
  slug: string
}
export const createFolderCollection = ({
  slug,
  debug,
  folderEnabledCollections,
  folderFieldName,
}: CreateFolderCollectionArgs): CollectionConfig => {
  const { collectionOptions, collectionSlugs } = folderEnabledCollections.reduce(
    (acc, collection: CollectionConfig) => {
      acc.collectionSlugs.push(collection.slug)
      acc.collectionOptions.push({
        label: collection.labels?.singular || collection.slug,
        value: collection.slug,
      })

      return acc
    },
    {
      collectionOptions: [] as Option[],
      collectionSlugs: [] as string[],
    },
  )

  return {
    slug,
    admin: {
      hidden: !debug,
      useAsTitle: 'name',
    },
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
      {
        name: 'assignedCollections',
        type: 'select',
        admin: {
          position: 'sidebar',
        },
        hasMany: true,
        options: [...collectionOptions, { label: 'All', value: 'all' }],
        required: true,
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
  }
}
