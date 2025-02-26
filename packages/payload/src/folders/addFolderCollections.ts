import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type { TextField } from '../fields/config/types.js'

import { foldersSlug, parentFolderFieldName } from './constants.js'
import { createFolderCollection } from './createFolderCollection.js'
import { createBaseFolderSearchField } from './fields/folderSearch.js'
import { ensureParentFolder } from './hooks/ensureParentFolder.js'

const isDebugEnabled = (collections: CollectionConfig[]) => {
  return collections.some((collection) => {
    if (collection?.admin && 'enableFolders' in collection.admin) {
      return (
        typeof collection.admin.enableFolders === 'object' && collection.admin.enableFolders.debug
      )
    }
  })
}

export function addFolderCollections(config: NonNullable<Config>): void {
  let debug = null
  const enabledCollectionSlugs = []
  if (!config.collections) {
    return
  }

  for (let i = 0; i < config.collections.length; i++) {
    const collection = config.collections[i]
    if (collection.admin?.enableFolders) {
      enabledCollectionSlugs.push(collection.slug)
      debug = debug ?? isDebugEnabled(config.collections)
      collection.admin.enableFolders = {
        debug,
      }

      adjustFolderEnabledCollection({ collection, debug })
    }
  }

  // add folder collection
  const folderCollection = createFolderCollection({
    collectionSlugs: enabledCollectionSlugs,
    debug: Boolean(debug),
  })

  if (!config.admin) {
    config.admin = {}
  }
  if (!config.admin?.components) {
    config.admin.components = {}
  }
  if (!config?.admin?.components?.providers) {
    config.admin.components.providers = []
  }

  config.collections.push(folderCollection)
}

function adjustFolderEnabledCollection({
  collection,
  debug,
}: {
  collection: CollectionConfig
  debug?: boolean
}): void {
  if (!collection.hooks) {
    collection.hooks = {}
  }
  if (!collection.hooks.beforeChange) {
    collection.hooks.beforeChange = []
  }
  collection.hooks.beforeChange.push(ensureParentFolder)

  let useAsTitle = collection.admin?.useAsTitle || (collection.upload ? 'filename' : 'id')
  const titleField = collection.fields.find((field): field is TextField => {
    if ('name' in field) {
      useAsTitle = collection.admin?.useAsTitle ?? useAsTitle
      return field.name === useAsTitle
    }
    return false
  })

  collection.fields.push(
    {
      name: parentFolderFieldName,
      type: 'relationship',
      hidden: !debug,
      index: true,
      relationTo: foldersSlug,
    },
    {
      ...createBaseFolderSearchField({ debug, useAsTitle }),
      access: titleField?.access,
      localized: titleField?.localized,
    },
  )
}
