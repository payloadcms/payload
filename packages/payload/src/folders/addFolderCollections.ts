import type { Config } from '../config/types.js'
import type { CollectionSlug } from '../index.js'

import { foldersSlug, parentFolderFieldName } from './constants.js'
import { createFolderCollection } from './createFolderCollection.js'

export async function addFolderCollections(config: NonNullable<Config>): Promise<void> {
  if (!config.collections) {
    return
  }

  if (config.folders?.enabled) {
    const enabledCollectionSlugs: CollectionSlug[] = []
    const debug = Boolean(config.folders?.debug)
    config.folders.slug = config.folders.slug || foldersSlug

    for (let i = 0; i < config.collections.length; i++) {
      const collection = config.collections[i]
      if (config.folders.collections[collection.slug]) {
        if (collection) {
          collection.fields.push({
            name: parentFolderFieldName,
            type: 'relationship',
            admin: {
              components: {
                Cell: '@payloadcms/ui/rsc#FolderTableCell',
                Field: false,
              },
              disableBulkEdit: true,
              hidden: !debug,
            },
            index: true,
            label: 'Folder',
            relationTo: config.folders.slug,
          })
          enabledCollectionSlugs.push(collection.slug)
        }
      }
    }

    if (enabledCollectionSlugs.length) {
      let folderCollection = createFolderCollection({
        slug: config.folders.slug,
        collectionSlugs: enabledCollectionSlugs,
        debug,
      })

      if (
        Array.isArray(config.folders.collectionOverrides) &&
        config.folders.collectionOverrides.length
      ) {
        for (const override of config.folders.collectionOverrides) {
          folderCollection = await override({ collection: folderCollection })
        }
      }
      config.collections.push(folderCollection)
    }
  }
}
