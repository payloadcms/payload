import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { TAXONOMY_PARENT_FIELD } from './constants.js'
import { findRelatedHandler } from './endpoints/findRelated.js'

/**
 * Sanitize and apply taxonomy configuration to a collection config
 *
 * Taxonomies automatically enable hierarchy for parent-child relationships
 * and add custom admin configuration for UI detection
 */
export const sanitizeTaxonomy = (collectionConfig: CollectionConfig, _config: Config): void => {
  if (!collectionConfig.taxonomy) {
    return
  }

  // Apply defaults for optional fields
  const parentFieldName = collectionConfig.taxonomy.parentFieldName || TAXONOMY_PARENT_FIELD
  const relatedCollections = collectionConfig.taxonomy.relatedCollections || {}

  // Apply hierarchy configuration (which will add parent field and hooks)
  collectionConfig.hierarchy = {
    parentFieldName,
    slugPathFieldName: collectionConfig.taxonomy.slugPathFieldName,
    titlePathFieldName: collectionConfig.taxonomy.titlePathFieldName,
    ...(collectionConfig.taxonomy.slugify && { slugify: collectionConfig.taxonomy.slugify }),
  }

  // Flag this collection as a taxonomy for UI to detect
  // Add endpoint to find related documents
  if (!collectionConfig.endpoints) {
    collectionConfig.endpoints = []
  }

  // Add the /related endpoint
  const hasRelatedEndpoint =
    Array.isArray(collectionConfig.endpoints) &&
    collectionConfig.endpoints.some((endpoint) => endpoint.path === '/:id/related')

  if (!hasRelatedEndpoint && Array.isArray(collectionConfig.endpoints)) {
    collectionConfig.endpoints.push({
      handler: findRelatedHandler,
      method: 'get',
      path: '/:id/related',
    })
  }

  // Set sanitized taxonomy config (will be further sanitized when hierarchy is applied)
  collectionConfig.taxonomy = {
    allowHasMany: collectionConfig.taxonomy.allowHasMany ?? true,
    parentFieldName,
    relatedCollections,
    slugPathFieldName: collectionConfig.taxonomy.slugPathFieldName,
    titlePathFieldName: collectionConfig.taxonomy.titlePathFieldName,
    ...(collectionConfig.taxonomy.icon && { icon: collectionConfig.taxonomy.icon }),
    ...(collectionConfig.taxonomy.slugify && { slugify: collectionConfig.taxonomy.slugify }),
    ...(collectionConfig.taxonomy.treeLimit !== undefined && {
      treeLimit: collectionConfig.taxonomy.treeLimit,
    }),
  } // Type will be correct after hierarchy sanitization
}
