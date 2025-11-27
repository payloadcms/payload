import type { Config } from '../../config/types.js'
import type { CollectionConfig } from './types.js'

import { addHierarchyToCollection } from '../../hierarchy/addHierarchyToCollection.js'

/**
 * Sanitize and apply hierarchy configuration to a collection config
 *
 *
 * @param collectionConfig
 * @param config
 * @returns
 */
export const sanitizeHierarchy = (collectionConfig: CollectionConfig, config: Config): void => {
  if (!collectionConfig.hierarchy) {
    return
  }

  // Apply hierarchy to collection (adds fields and hooks)
  const hierarchyOptions: {
    collectionConfig: typeof collectionConfig
    config: typeof config
    parentFieldName: string
    slugify?: (text: string) => string
    slugPathFieldName?: string
    titlePathFieldName?: string
  } = {
    collectionConfig,
    config,
    parentFieldName: collectionConfig.hierarchy.parentFieldName,
  }

  if (collectionConfig.hierarchy.slugify) {
    hierarchyOptions.slugify = collectionConfig.hierarchy.slugify
  }
  if (collectionConfig.hierarchy.slugPathFieldName) {
    hierarchyOptions.slugPathFieldName = collectionConfig.hierarchy.slugPathFieldName
  }
  if (collectionConfig.hierarchy.titlePathFieldName) {
    hierarchyOptions.titlePathFieldName = collectionConfig.hierarchy.titlePathFieldName
  }

  addHierarchyToCollection(hierarchyOptions)

  // Set sanitized hierarchy config with defaults
  collectionConfig.hierarchy = {
    depthFieldName: collectionConfig.hierarchy.depthFieldName || '_h_depth',
    parentFieldName: collectionConfig.hierarchy.parentFieldName,
    parentTreeFieldName: collectionConfig.hierarchy.parentTreeFieldName || '_h_parentTree',
    slugPathFieldName: hierarchyOptions.slugPathFieldName || '_h_slugPath',
    titlePathFieldName: hierarchyOptions.titlePathFieldName || '_h_titlePath',
    ...(collectionConfig.hierarchy.slugify && { slugify: collectionConfig.hierarchy.slugify }),
  }
}
