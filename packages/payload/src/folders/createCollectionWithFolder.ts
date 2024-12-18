import type { CollectionConfig, Where } from '../index.js'

import { generateFolderPrefix } from './hooks/generateFolderPrefix.js'
import { createFolderConstraint } from './utils/createFolderConstraint.js'

type ModifyCollectionArgs = {
  collectionConfig: CollectionConfig
  debug?: boolean
  relatedFolderCollectionSlug: string
}
export function createCollectionWithFolder({
  collectionConfig,
  debug = false,
  relatedFolderCollectionSlug,
}: ModifyCollectionArgs): CollectionConfig {
  // Add custom Upload component
  if (!collectionConfig.admin.components) {
    collectionConfig.admin.components = {}
  }
  if (!collectionConfig.admin.components?.edit) {
    collectionConfig.admin.components.edit = {}
  }
  collectionConfig.admin.components.edit.Upload = '@payloadcms/ui#UploadWithFolderSelection'

  // Add folders before list component
  if (!collectionConfig.admin.components?.beforeListTable) {
    collectionConfig.admin.components.beforeListTable = []
  }
  collectionConfig.admin.components.beforeListTable = [
    {
      clientProps: {
        folderSlug: relatedFolderCollectionSlug,
      },
      path: '@payloadcms/ui/rsc#Folders',
    },
  ]

  // Add hidden fields to track folder hierarchy
  collectionConfig.fields.push(
    {
      name: 'prefix',
      type: 'text',
      admin: {
        hidden: !debug,
      },
      index: true,
      label: 'Folder Prefix',
    },
    {
      name: 'parentFolder',
      type: 'relationship',
      admin: {
        hidden: !debug,
      },
      index: true,
      label: 'Parent Folder',
      relationTo: relatedFolderCollectionSlug,
    },
  )

  // Add hooks to update prefix when parentFolder changes
  if (!collectionConfig.hooks) {
    collectionConfig.hooks = {}
  }
  if (!collectionConfig.hooks.beforeChange) {
    collectionConfig.hooks.beforeChange = []
  }
  collectionConfig.hooks.beforeChange.push(async ({ data, req }) => {
    if ('parentFolder' in data) {
      data.prefix = await generateFolderPrefix({
        folderCollectionSlug: relatedFolderCollectionSlug,
        parentFolder: data.parentFolder,
        payload: req.payload,
      })
    }

    return data
  })

  // Add folderCollectionSlug to the collection config
  if (!collectionConfig.admin?.custom) {
    collectionConfig.admin.custom = {}
  }
  collectionConfig.admin.custom.folderCollectionSlug = relatedFolderCollectionSlug

  // Add custom baseListFilter for folders
  const existingFilter = collectionConfig.admin?.baseListFilter
  collectionConfig.admin.baseListFilter = async (args): Promise<Where> => {
    const folderFilter = createFolderConstraint({ folderID: args.req.query?.folderID })
    if (typeof existingFilter === 'function') {
      const collectionFilter = await existingFilter(args)
      if (collectionFilter) {
        return {
          and: [folderFilter, collectionFilter],
        }
      }
    }
    return folderFilter
  }

  return collectionConfig
}
