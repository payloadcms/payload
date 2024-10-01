import type { CollectionConfig } from '../collections/config/types.js'
import type { CollectionSlug } from '../index.js'

import { populateFolderDataEndpoint } from './endpoints/populateFolderData.js'
import { deleteDependentDocs } from './hooks/deleteDependentDocs.js'
import { generateFolderPrefix } from './hooks/generateFolderPrefix.js'
import { updateDependentDocs } from './hooks/updateDependentDocs.js'

type CreateFolderCollectionArgs = {
  debug?: boolean
  relatedCollectionSlug: CollectionSlug
}
export const createFolderCollection = ({
  debug,
  relatedCollectionSlug,
}: CreateFolderCollectionArgs): CollectionConfig => {
  const folderCollectionSlug = `${relatedCollectionSlug}-folders`

  return {
    slug: folderCollectionSlug,
    admin: {
      hidden: !debug,
      useAsTitle: 'name',
    },
    endpoints: [populateFolderDataEndpoint({ mediaSlug: relatedCollectionSlug })],
    fields: [
      {
        name: 'name',
        type: 'text',
        index: true,
        required: true,
      },
      {
        name: 'prefix',
        type: 'text',
        index: true,
      },
      {
        name: 'parentFolder',
        type: 'relationship',
        index: true,
        relationTo: folderCollectionSlug,
      },
    ],
    hooks: {
      afterChange: [async (args) => await updateDependentDocs({ ...args, relatedCollectionSlug })],
      afterDelete: [async (args) => await deleteDependentDocs({ ...args, relatedCollectionSlug })],
      beforeChange: [
        async ({ data, req }) => {
          if ('parentFolder' in data) {
            data.prefix = await generateFolderPrefix({
              folderCollectionSlug,
              parentFolder: data.parentFolder,
              payload: req.payload,
            })
          }

          return data
        },
      ],
    },
    typescript: {
      interface: 'FolderInterface',
    },
  }
}
