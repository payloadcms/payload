import type { Config } from '../config/types.js'
import type { RelationshipField } from '../fields/config/types.js'
import type { SanitizedRelatedCollection } from './types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { getTaxonomyFieldName } from './constants.js'

/**
 * Validate that related collections have the required taxonomy fields.
 * Must be called after all collections are sanitized.
 *
 * This function:
 * 1. Validates that each related collection has a taxonomy field with the expected name
 * 2. Validates that the field points to the correct taxonomy collection
 * 3. Builds the sanitized relatedCollections config with field info
 *
 * Throws an error if a related collection is missing the required taxonomy field.
 */
export const validateTaxonomyFields = (config: Config): void => {
  const taxonomyCollections = config.collections?.filter((c) => c.taxonomy) || []

  for (const taxonomyCollection of taxonomyCollections) {
    const taxonomy = taxonomyCollection.taxonomy

    if (!taxonomy?.relatedCollections) {
      continue
    }

    // Skip if already sanitized (relatedCollections is already a Record)
    if (!Array.isArray(taxonomy.relatedCollections)) {
      continue
    }

    const relatedCollectionSlugs = taxonomy.relatedCollections

    // Build sanitized relatedCollections with field info
    const sanitizedRelatedCollections: Record<string, SanitizedRelatedCollection> = {}

    for (const relatedSlug of relatedCollectionSlugs) {
      const relatedCollection = config.collections?.find((c) => c.slug === relatedSlug)

      if (!relatedCollection) {
        throw new Error(
          `Taxonomy "${taxonomyCollection.slug}" references unknown collection "${relatedSlug}" in relatedCollections. ` +
            `Make sure the collection exists.`,
        )
      }

      const expectedFieldName = getTaxonomyFieldName(taxonomyCollection.slug)

      // Find the taxonomy field in the related collection
      const taxonomyField = relatedCollection.fields.find(
        (field) => fieldAffectsData(field) && field.name === expectedFieldName,
      ) as RelationshipField | undefined

      if (!taxonomyField) {
        throw new Error(
          `Collection "${relatedSlug}" is listed in taxonomy "${taxonomyCollection.slug}" relatedCollections ` +
            `but does not have the required taxonomy field "${expectedFieldName}". ` +
            `Add the field using: createTaxonomyField({ taxonomySlug: '${taxonomyCollection.slug}' })`,
        )
      }

      // Validate the field points to the correct taxonomy
      if (taxonomyField.relationTo !== taxonomyCollection.slug) {
        throw new Error(
          `Collection "${relatedSlug}" has a field named "${expectedFieldName}" but it points to ` +
            `"${taxonomyField.relationTo}" instead of "${taxonomyCollection.slug}". ` +
            `Use createTaxonomyField({ taxonomySlug: '${taxonomyCollection.slug}' }) to create the correct field.`,
        )
      }

      // Store sanitized config
      sanitizedRelatedCollections[relatedSlug] = {
        fieldName: expectedFieldName,
        hasMany: taxonomyField.hasMany ?? false,
      }
    }

    // Update taxonomy config with sanitized relatedCollections
    // Type assertion needed: we're transforming from string[] to Record<string, SanitizedRelatedCollection>
    ;(
      taxonomy as unknown as { relatedCollections: Record<string, SanitizedRelatedCollection> }
    ).relatedCollections = sanitizedRelatedCollections
  }
}
