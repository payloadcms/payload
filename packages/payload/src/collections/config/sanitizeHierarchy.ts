import type { Config } from '../../config/types.js'
import type { CollectionConfig } from './types.js'

import { fieldAffectsData } from '../../fields/config/types.js'
import { addHierarchyToCollection } from '../../hierarchy/addHierarchyToCollection.js'
import { buildParentField } from '../../hierarchy/buildParentField.js'
import {
  HIERARCHY_PARENT_FIELD,
  HIERARCHY_SLUG_PATH_FIELD,
  HIERARCHY_TITLE_PATH_FIELD,
} from '../../hierarchy/constants.js'

/**
 * Sanitize and apply hierarchy configuration to a collection config
 *
 *
 * @param collectionConfig
 * @param config
 * @returns
 */
export const sanitizeHierarchy = (collectionConfig: CollectionConfig, _config: Config): void => {
  if (!collectionConfig.hierarchy) {
    collectionConfig.hierarchy = false
    return
  }

  // Normalize boolean to object
  if (collectionConfig.hierarchy === true) {
    collectionConfig.hierarchy = {
      parentFieldName: HIERARCHY_PARENT_FIELD,
    }
  }

  const parentFieldName = collectionConfig.hierarchy.parentFieldName

  // Check if parent field already exists
  const existingParentField = collectionConfig.fields.find(
    (field) => fieldAffectsData(field) && field.name === parentFieldName,
  )

  if (existingParentField) {
    // Validate existing parent field configuration
    if (existingParentField.type !== 'relationship') {
      throw new Error(
        `Hierarchy parent field "${parentFieldName}" in collection "${collectionConfig.slug}" must be a relationship field`,
      )
    }

    if (existingParentField.hasMany !== false) {
      throw new Error(
        `Hierarchy parent field "${parentFieldName}" in collection "${collectionConfig.slug}" must have hasMany set to false`,
      )
    }

    if (existingParentField.localized === true) {
      throw new Error(
        `Hierarchy parent field "${parentFieldName}" in collection "${collectionConfig.slug}" cannot be localized. The parent relationship must be consistent across all locales.`,
      )
    }
  } else {
    // Auto-create parent field if it doesn't exist
    const parentField = buildParentField({
      collectionSlug: collectionConfig.slug,
      parentFieldName,
    })

    collectionConfig.fields.unshift(parentField)
  }

  // Apply defaults for optional fields
  const slugPathFieldName =
    collectionConfig.hierarchy.slugPathFieldName || HIERARCHY_SLUG_PATH_FIELD
  const titlePathFieldName =
    collectionConfig.hierarchy.titlePathFieldName || HIERARCHY_TITLE_PATH_FIELD

  // Apply hierarchy to collection (adds fields and hooks)
  addHierarchyToCollection({
    collectionConfig,
    parentFieldName: collectionConfig.hierarchy.parentFieldName,
    slugPathFieldName,
    titlePathFieldName,
  })

  // Set sanitized hierarchy config
  collectionConfig.hierarchy = {
    parentFieldName: collectionConfig.hierarchy.parentFieldName,
    slugPathFieldName,
    titlePathFieldName,
    ...(collectionConfig.hierarchy.slugify && { slugify: collectionConfig.hierarchy.slugify }),
  }
}
