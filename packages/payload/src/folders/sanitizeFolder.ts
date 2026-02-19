import type { CollectionConfig, SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { DEFAULT_FOLDER_TREE_LIMIT, FOLDER_PARENT_FIELD, getFolderFieldName } from './constants.js'
import { ensureSafeCollectionsChange } from './hooks/ensureSafeCollectionsChange.js'

/**
 * Sanitize and apply folder configuration to a collection config.
 *
 * Sets defaults and adds hooks. The `folderType` field (for collectionSpecific)
 * is added later in `validateFolderFields` after related collections are discovered.
 */
export const sanitizeFolder = (collectionConfig: CollectionConfig, _config: Config): void => {
  if (!collectionConfig.folder) {
    return
  }

  const folderConfig = collectionConfig.folder

  // Apply defaults
  const parentFieldName = folderConfig.parentFieldName || FOLDER_PARENT_FIELD
  const collectionSpecific = folderConfig.collectionSpecific ?? false
  const treeLimit = folderConfig.treeLimit ?? DEFAULT_FOLDER_TREE_LIMIT

  // Build the folder field name that related collections use
  const folderFieldName = getFolderFieldName(collectionConfig.slug)

  // Apply hierarchy configuration (enables getAncestors and path computation)
  // Only set optional fields if they're defined to avoid polluting the config
  collectionConfig.hierarchy = {
    parentFieldName,
    ...(folderConfig.slugPathFieldName && { slugPathFieldName: folderConfig.slugPathFieldName }),
    ...(folderConfig.titlePathFieldName && { titlePathFieldName: folderConfig.titlePathFieldName }),
    ...(folderConfig.slugify && { slugify: folderConfig.slugify }),
  }

  // If collectionSpecific, add beforeValidate hook to enforce scope inheritance
  // (folderType field is added in validateFolderFields after discovery)
  if (collectionSpecific) {
    if (!collectionConfig.hooks) {
      collectionConfig.hooks = {}
    }
    if (!collectionConfig.hooks.beforeValidate) {
      collectionConfig.hooks.beforeValidate = []
    }
    collectionConfig.hooks.beforeValidate.push(
      ensureSafeCollectionsChange({
        folderFieldName,
        foldersSlug: collectionConfig.slug,
        parentFieldName,
      }),
    )
  }

  const sanitized = collectionConfig as unknown as SanitizedCollectionConfig

  // Set sanitized folder config (folder-specific settings only)
  sanitized.folder = {
    collectionSpecific,
  }

  // Set taxonomy config for list view rendering and shared hierarchy settings
  // Folders are a special case of taxonomies with allowHasMany: false
  sanitized.taxonomy = {
    allowHasMany: false,
    icon: '@payloadcms/ui#FolderIcon',
    parentFieldName,
    relatedCollections: {}, // Auto-populated in validateFolderFields
    treeLimit,
  }
}
