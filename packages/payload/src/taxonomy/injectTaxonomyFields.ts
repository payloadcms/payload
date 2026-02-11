import type { Config } from '../config/types.js'
import type { RelationshipField } from '../fields/config/types.js'
import type { SanitizedRelatedCollection, TaxonomyRelatedCollectionConfig } from './types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { getTaxonomyFieldName } from './constants.js'

/**
 * Inject taxonomy relationship fields into related collections.
 * Must be called after all collections are sanitized.
 *
 * This function mutates the config, transforming TaxonomyConfig.relatedCollections
 * from user config format to SanitizedRelatedCollection format.
 */
export const injectTaxonomyFields = (config: Config): void => {
  const taxonomyCollections = config.collections?.filter((c) => c.taxonomy) || []

  for (const taxonomyCollection of taxonomyCollections) {
    const taxonomy = taxonomyCollection.taxonomy

    if (!taxonomy?.relatedCollections) {
      continue
    }

    const relatedCollectionsConfig = taxonomy.relatedCollections as Record<
      string,
      TaxonomyRelatedCollectionConfig
    >

    // Build sanitized relatedCollections with field info
    const sanitizedRelatedCollections: Record<string, SanitizedRelatedCollection> = {}

    for (const [relatedSlug, relationConfig] of Object.entries(relatedCollectionsConfig)) {
      const relatedCollection = config.collections?.find((c) => c.slug === relatedSlug)

      if (!relatedCollection) {
        console.warn(
          `Taxonomy "${taxonomyCollection.slug}" references unknown collection "${relatedSlug}" in relatedCollections`,
        )
        continue
      }

      const fieldName = getTaxonomyFieldName(taxonomyCollection.slug)
      const { admin: adminOverrides, ...restOverrides } = relationConfig.fieldOverrides || {}
      const hasMany = restOverrides.hasMany ?? false

      // Check if field already exists
      const existingField = relatedCollection.fields.find(
        (field) => fieldAffectsData(field) && field.name === fieldName,
      )

      if (!existingField) {
        // Build and inject the relationship field
        // Type assertion needed because we're building the field dynamically with spread
        const taxonomyField = {
          name: fieldName,
          type: 'relationship',
          admin: {
            position: 'sidebar',
            ...adminOverrides,
          },
          hasMany,
          index: true,
          label: String(
            typeof taxonomyCollection.labels?.singular === 'string'
              ? taxonomyCollection.labels.singular
              : taxonomyCollection.slug,
          ),
          relationTo: taxonomyCollection.slug,
          ...restOverrides,
        } as RelationshipField

        relatedCollection.fields.push(taxonomyField)
      }

      // Store sanitized config (preserving fieldOverrides for compatibility)
      sanitizedRelatedCollections[relatedSlug] = {
        fieldName,
        fieldOverrides: relationConfig.fieldOverrides,
        hasMany,
      }
    }

    // Update taxonomy config with sanitized relatedCollections
    // Type assertion needed: we're mutating from TaxonomyConfig to SanitizedTaxonomyConfig
    ;(
      taxonomy as { relatedCollections: Record<string, SanitizedRelatedCollection> }
    ).relatedCollections = sanitizedRelatedCollections
  }
}
