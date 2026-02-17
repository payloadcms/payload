import type { Config, SanitizedConfig } from '../config/types.js'
import type { CollectionConfig } from '../index.js'

import { sanitizeCollection } from '../collections/config/sanitize.js'
import { createInternalFolderCollection } from './createFolderCollection.js'

export async function addFolderCollection({
  collectionSpecific,
  config,
  folderEnabledCollections,
  richTextSanitizationPromises = [],
  validRelationships = [],
}: {
  collectionSpecific: boolean
  config: NonNullable<Config>
  folderEnabledCollections: CollectionConfig[]
  richTextSanitizationPromises?: Array<(config: SanitizedConfig) => Promise<void>>
  validRelationships?: string[]
}): Promise<void> {
  if (config.folders === false) {
    return
  }

  let folderCollectionConfig = createInternalFolderCollection({
    slug: config.folders!.slug as string,
    collectionSpecific,
    debug: config.folders!.debug,
    folderEnabledCollections,
    folderFieldName: config.folders!.fieldName as string,
  })

  const collectionIndex = config.collections!.push(folderCollectionConfig)

  if (
    Array.isArray(config.folders?.collectionOverrides) &&
    config?.folders.collectionOverrides.length
  ) {
    for (const override of config.folders.collectionOverrides) {
      folderCollectionConfig = await override({ collection: folderCollectionConfig })
    }
  }

  const sanitizedCollectionWithOverrides = await sanitizeCollection(
    config as unknown as Config,
    folderCollectionConfig,
    richTextSanitizationPromises,
    validRelationships,
  )

  config.collections![collectionIndex - 1] = sanitizedCollectionWithOverrides
}
