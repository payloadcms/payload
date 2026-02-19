import type { CollectionConfig, SanitizedCollectionConfig } from '../collections/config/types.js'
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

  // Apply hierarchy configuration (which will add parent field and hooks)
  // Only set optional fields if they're defined to avoid polluting the config
  collectionConfig.hierarchy = {
    parentFieldName,
    ...(collectionConfig.taxonomy.slugPathFieldName && {
      slugPathFieldName: collectionConfig.taxonomy.slugPathFieldName,
    }),
    ...(collectionConfig.taxonomy.titlePathFieldName && {
      titlePathFieldName: collectionConfig.taxonomy.titlePathFieldName,
    }),
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

  // Capture input values before casting
  const { allowHasMany, icon, treeLimit } = collectionConfig.taxonomy

  const sanitized = collectionConfig as unknown as SanitizedCollectionConfig

  // Set sanitized taxonomy config (relatedCollections populated in validateTaxonomyFields,
  // hierarchy fields populated in sanitizeHierarchy)
  sanitized.taxonomy = {
    allowHasMany: allowHasMany ?? true,
    parentFieldName,
    relatedCollections: {}, // Auto-populated in validateTaxonomyFields
    ...(icon && { icon }),
    ...(treeLimit !== undefined && { treeLimit }),
  }
}
