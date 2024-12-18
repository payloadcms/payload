import type { Config } from '../config/types.js'

import { createCollectionWithFolder } from './createCollectionWithFolder.js'
import { createFolderCollection } from './createFolderCollection.js'

export function addFolderCollections(config: Config): void {
  let addedFolderProviders = false
  const folderCollections = []
  for (let i = 0; i < config.collections.length; i++) {
    const c = config.collections[i]
    if (c.admin.enableFolders) {
      c.admin.enableFolders = {
        debug: typeof c.admin.enableFolders === 'boolean' ? false : c.admin.enableFolders.debug,
      }
      const folderCollection = createFolderCollection({
        debug: c.admin.enableFolders.debug,
        relatedCollectionSlug: c.slug,
      })
      config.collections[i] = createCollectionWithFolder({
        collectionConfig: c,
        debug: c.admin.enableFolders.debug,
        relatedFolderCollectionSlug: folderCollection.slug,
      })
      folderCollections.push(folderCollection)

      if (!addedFolderProviders) {
        if (!config.admin.components?.providers) {
          config.admin.components.providers = []
        }
        config.admin.components.providers.push(
          '@payloadcms/ui#FolderListSettingsProvider',
          '@payloadcms/ui#FolderAndDocumentSelectionsProvider',
        )
        addedFolderProviders = true
      }
    }
  }

  config.collections.push(...folderCollections)
}
