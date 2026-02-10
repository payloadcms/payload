import type { Config } from '../config/types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { buildTaxonomyRelationshipField } from './buildTaxonomyRelationshipField.js'
import { getTaxonomyFieldName } from './constants.js'

/**
 * Inject taxonomy relationship fields into related collections.
 * Must be called after all collections are sanitized.
 */
export const injectTaxonomyFields = (config: Config): void => {
  const taxonomyCollections = config.collections?.filter((c) => c.taxonomy) || []

  for (const taxonomyCollection of taxonomyCollections) {
    const taxonomy = taxonomyCollection.taxonomy

    if (typeof taxonomy !== 'object' || !taxonomy.relatedCollections) {
      continue
    }

    const relatedCollectionsConfig = taxonomy.relatedCollections as Record<
      string,
      { hasMany?: boolean }
    >

    // Build sanitized relatedCollections with field info
    const sanitizedRelatedCollections: Record<string, { fieldName: string; hasMany: boolean }> = {}

    for (const [relatedSlug, relationConfig] of Object.entries(relatedCollectionsConfig)) {
      const relatedCollection = config.collections?.find((c) => c.slug === relatedSlug)

      if (!relatedCollection) {
        console.warn(
          `Taxonomy "${taxonomyCollection.slug}" references unknown collection "${relatedSlug}" in relatedCollections`,
        )
        continue
      }

      const fieldName = getTaxonomyFieldName(taxonomyCollection.slug)
      const hasMany = relationConfig.hasMany ?? false

      // Check if field already exists
      const existingField = relatedCollection.fields.find(
        (field) => fieldAffectsData(field) && field.name === fieldName,
      )

      if (!existingField) {
        // Inject the relationship field
        const taxonomyField = buildTaxonomyRelationshipField({
          fieldName,
          hasMany,
          label: String(taxonomyCollection.labels?.singular || taxonomyCollection.slug),
          taxonomySlug: taxonomyCollection.slug,
        })

        relatedCollection.fields.push(taxonomyField)
      }

      // Store sanitized config
      sanitizedRelatedCollections[relatedSlug] = {
        fieldName,
        hasMany,
      }
    }

    // Update taxonomy config with sanitized relatedCollections
    taxonomy.relatedCollections = sanitizedRelatedCollections
  }
}
