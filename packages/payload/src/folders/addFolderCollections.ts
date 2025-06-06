import type { Config } from '../config/types.js'
import type { CollectionSlug } from '../index.js'

import { createFolderCollection } from './createFolderCollection.js'

export async function addFolderCollections(config: NonNullable<Config>): Promise<void> {
  if (!config.collections || !config.folders) {
    return
  }

  const enabledCollectionSlugs: CollectionSlug[] = []
  const debug = Boolean(config?.folders?.debug)
  const folderFieldName = config?.folders?.fieldName as unknown as string
  const folderSlug = config?.folders?.slug as unknown as CollectionSlug

  for (let i = 0; i < config.collections.length; i++) {
    const collection = config.collections[i]
    if (collection && collection?.folders) {
      collection.fields.push({
        name: folderFieldName,
        type: 'relationship',
        admin: {
          allowCreate: false,
          allowEdit: false,
          components: {
            Cell: '@payloadcms/ui/rsc#FolderTableCell',
            Field: '@payloadcms/ui/rsc#FolderEditField',
          },
        },
        index: true,
        label: 'Folder',
        relationTo: folderSlug,
      })
      enabledCollectionSlugs.push(collection.slug)
    }
  }

  if (enabledCollectionSlugs.length) {
    let folderCollection = createFolderCollection({
      slug: folderSlug,
      collectionSlugs: enabledCollectionSlugs,
      debug,
      folderFieldName,
    })

    if (
      Array.isArray(config?.folders?.collectionOverrides) &&
      config?.folders.collectionOverrides.length
    ) {
      for (const override of config.folders.collectionOverrides) {
        folderCollection = await override({ collection: folderCollection })
      }
    }
    config.collections.push(folderCollection)
  }
}
