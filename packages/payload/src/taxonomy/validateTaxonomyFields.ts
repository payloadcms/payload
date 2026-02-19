import type { Config } from '../config/types.js'
import type { RelationshipField } from '../fields/config/types.js'
import type { SanitizedRelatedCollection } from './types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { getTaxonomyFieldName } from './constants.js'

/**
 * Discover and validate taxonomy fields in related collections.
 * Must be called after all collections are sanitized.
 *
 * This function:
 * 1. Auto-discovers related collections by scanning for taxonomy fields
 * 2. Validates field points to the correct taxonomy collection
 * 3. Applies allowHasMany setting
 * 4. Builds the sanitized relatedCollections config with field info
 */
export const validateTaxonomyFields = (config: Config): void => {
  const taxonomyCollections = config.collections?.filter((col) => col.taxonomy) || []

  for (const taxonomyCollection of taxonomyCollections) {
    const taxonomy = taxonomyCollection.taxonomy

    if (!taxonomy) {
      continue
    }

    const expectedFieldName = getTaxonomyFieldName(taxonomyCollection.slug)
    const allowHasMany = taxonomy.allowHasMany ?? true

    // Build relatedCollections by scanning all collections for taxonomy fields
    const sanitizedRelatedCollections: Record<string, SanitizedRelatedCollection> = {}

    for (const collection of config.collections || []) {
      // Skip the taxonomy collection itself
      if (collection.slug === taxonomyCollection.slug) {
        continue
      }

      // Find taxonomy field in this collection
      const taxonomyField = collection.fields.find(
        (field) =>
          fieldAffectsData(field) &&
          field.name === expectedFieldName &&
          field.type === 'relationship' &&
          (field as RelationshipField).relationTo === taxonomyCollection.slug,
      ) as RelationshipField | undefined

      if (!taxonomyField) {
        continue
      }

      // Apply allowHasMany setting
      if (!allowHasMany) {
        taxonomyField.hasMany = false
      }

      // Store discovered collection
      sanitizedRelatedCollections[collection.slug] = {
        fieldName: expectedFieldName,
        hasMany: allowHasMany ? (taxonomyField.hasMany ?? false) : false,
      }
    }

    // Update taxonomy config with sanitized relatedCollections
    ;(
      taxonomy as unknown as { relatedCollections: Record<string, SanitizedRelatedCollection> }
    ).relatedCollections = sanitizedRelatedCollections
  }
}
