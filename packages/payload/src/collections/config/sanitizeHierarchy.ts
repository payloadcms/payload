import type { Config } from '../../config/types.js'
import type { CollectionConfig } from './types.js'

import { fieldAffectsData } from '../../fields/config/types.js'
import { addHierarchyToCollection } from '../../hierarchy/addHierarchyToCollection.js'
import { buildParentField } from '../../hierarchy/buildParentField.js'

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

  // Normalize boolean to object
  if (collectionConfig.hierarchy === true) {
    collectionConfig.hierarchy = {
      parentFieldName: 'parent',
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

    if (existingParentField.relationTo !== collectionConfig.slug) {
      throw new Error(
        `Hierarchy parent field "${parentFieldName}" in collection "${collectionConfig.slug}" must relate to the same collection (expected relationTo: "${collectionConfig.slug}", got: "${existingParentField.relationTo}")`,
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

  // Apply hierarchy to collection (adds fields and hooks)
  const generatePaths = collectionConfig.hierarchy.generatePaths ?? true

  const hierarchyOptions: {
    collectionConfig: typeof collectionConfig
    config: typeof config
    generatePaths: boolean
    parentFieldName: string
    slugify?: (text: string) => string
    slugPathFieldName?: string
    titlePathFieldName?: string
  } = {
    collectionConfig,
    config,
    generatePaths,
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
    generatePaths,
    parentFieldName: collectionConfig.hierarchy.parentFieldName,
    slugPathFieldName: hierarchyOptions.slugPathFieldName || '_h_slugPath',
    titlePathFieldName: hierarchyOptions.titlePathFieldName || '_h_titlePath',
    ...(collectionConfig.hierarchy.slugify && { slugify: collectionConfig.hierarchy.slugify }),
  }
}
