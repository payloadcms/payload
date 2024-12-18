import type { SanitizedCollectionConfig } from '../index.js'

import { generateFolderPrefix } from './hooks/generateFolderPrefix.js'

type ModifyCollectionArgs = {
  collectionConfig: SanitizedCollectionConfig
  debug?: boolean
  relatedFolderCollectionSlug: string
}
export function mutateRelatedFolderCollection({
  collectionConfig,
  debug = false,
  relatedFolderCollectionSlug,
}: ModifyCollectionArgs): void {
  collectionConfig.fields = [
    ...collectionConfig.fields,
    {
      name: 'prefix',
      type: 'text',
      admin: {
        hidden: !collectionConfig.admin.enableFolders?.debug,
      },
      index: true,
    },
    {
      name: 'parentFolder',
      type: 'relationship',
      admin: {
        hidden: !debug,
      },
      index: true,
      relationTo: relatedFolderCollectionSlug,
    },
  ]

  collectionConfig.hooks.beforeChange = [
    ...(collectionConfig.hooks?.beforeChange || []),
    async ({ data, req }) => {
      if ('parentFolder' in data) {
        data.prefix = await generateFolderPrefix({
          folderCollectionSlug: relatedFolderCollectionSlug,
          parentFolder: data.parentFolder,
          payload: req.payload,
        })
      }

      return data
    },
  ]
}
