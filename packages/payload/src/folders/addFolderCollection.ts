import type { Config, SanitizedConfig } from '../config/types.js'
import type { CollectionConfig, SanitizedCollectionConfig } from '../index.js'

import { sanitizeCollection } from '../collections/config/sanitize.js'
import { createFolderCollection } from './createFolderCollection.js'

export async function addFolderCollection({
  config,
  folderEnabledCollections = [],
  richTextSanitizationPromises = [],
  validRelationships = [],
}: {
  config: NonNullable<Config>
  folderEnabledCollections?: CollectionConfig[]
  richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>
  validRelationships?: string[]
}): Promise<null | SanitizedCollectionConfig> {
  if (config.folders === false) {
    return null
  }

  if (folderEnabledCollections.length) {
    const folderCollectionConfig = createFolderCollection({
      slug: config.folders!.slug as string,
      debug: config.folders!.debug,
      folderEnabledCollections,
      folderFieldName: config.folders!.fieldName as string,
    })

    const collectionIndex = config.collections!.push(folderCollectionConfig)

    let sanitizedFolderConfig = await sanitizeCollection(
      config as unknown as Config,
      folderCollectionConfig,
      richTextSanitizationPromises,
      validRelationships,
    )

    if (
      config?.folders &&
      Array.isArray(config?.folders?.collectionOverrides) &&
      config?.folders.collectionOverrides.length
    ) {
      for (const override of config.folders.collectionOverrides) {
        sanitizedFolderConfig = await override({ collection: sanitizedFolderConfig })
      }
    }
    config.collections![collectionIndex - 1] = sanitizedFolderConfig

    return sanitizedFolderConfig
  }

  return null
}
