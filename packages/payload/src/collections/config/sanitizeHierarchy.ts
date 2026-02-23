import type { Config } from '../../config/types.js'
import type { SanitizedHierarchyConfig } from '../../hierarchy/types.js'
import type { CollectionConfig } from './types.js'

import { fieldAffectsData } from '../../fields/config/types.js'
import { addHierarchyToCollection } from '../../hierarchy/addHierarchyToCollection.js'
import { buildParentField } from '../../hierarchy/buildParentField.js'
import {
  DEFAULT_ALLOW_HAS_MANY,
  DEFAULT_HIERARCHY_TREE_LIMIT,
  getHierarchyFieldName,
  HIERARCHY_SLUG_PATH_FIELD,
  HIERARCHY_TITLE_PATH_FIELD,
} from '../../hierarchy/constants.js'
import { findRelatedHandler } from '../../hierarchy/endpoints/findRelated.js'
import { ensureSafeCollectionsChange } from '../../hierarchy/hooks/ensureSafeCollectionsChange.js'
import { slugify as defaultSlugify } from '../../utilities/slugify.js'

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

  // Normalize boolean to object and apply parentFieldName default
  const defaultParentFieldName = getHierarchyFieldName(collectionConfig.slug)

  if (collectionConfig.hierarchy === true) {
    collectionConfig.hierarchy = {
      parentFieldName: defaultParentFieldName,
    }
  }

  const parentFieldName = collectionConfig.hierarchy.parentFieldName ?? defaultParentFieldName

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
  const allowHasMany = collectionConfig.hierarchy.allowHasMany ?? DEFAULT_ALLOW_HAS_MANY
  const rawCollectionSpecific = collectionConfig.hierarchy.collectionSpecific
  const collectionSpecific: { fieldName: string } | false =
    rawCollectionSpecific === true
      ? { fieldName: 'hierarchyType' }
      : rawCollectionSpecific
        ? { fieldName: rawCollectionSpecific.fieldName ?? 'hierarchyType' }
        : false
  const joinField = collectionConfig.hierarchy.joinField
    ? { fieldName: collectionConfig.hierarchy.joinField.fieldName }
    : undefined
  const slugify =
    collectionConfig.hierarchy.slugify ?? ((text: string) => defaultSlugify(text) ?? '')
  const treeLimit = collectionConfig.hierarchy.admin?.treeLimit ?? DEFAULT_HIERARCHY_TREE_LIMIT
  const iconComponent = collectionConfig.hierarchy.admin?.components?.Icon

  // Apply hierarchy to collection (adds fields and hooks)
  addHierarchyToCollection({
    collectionConfig,
    parentFieldName: collectionConfig.hierarchy.parentFieldName,
    slugPathFieldName,
    titlePathFieldName,
  })

  // Add /related endpoint for finding related documents
  if (!collectionConfig.endpoints) {
    collectionConfig.endpoints = []
  }

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

  // If collectionSpecific, add beforeValidate hook to enforce scope inheritance
  // (hierarchyType field is added in validateHierarchyFields after discovery)
  if (collectionSpecific) {
    // Use parentFieldName for both - backward compatible configs use the same field name everywhere
    if (!collectionConfig.hooks) {
      collectionConfig.hooks = {}
    }
    if (!collectionConfig.hooks.beforeValidate) {
      collectionConfig.hooks.beforeValidate = []
    }
    collectionConfig.hooks.beforeValidate.push(
      ensureSafeCollectionsChange({
        folderFieldName: parentFieldName,
        foldersSlug: collectionConfig.slug,
        parentFieldName,
        typeFieldName: collectionSpecific.fieldName,
      }),
    )
  }

  // Set sanitized hierarchy config (cast needed as we're transitioning from HierarchyConfig to SanitizedHierarchyConfig)
  ;(collectionConfig as unknown as { hierarchy: SanitizedHierarchyConfig }).hierarchy = {
    admin: {
      components: {
        ...(iconComponent && { Icon: iconComponent }),
      },
      treeLimit,
    },
    allowHasMany,
    collectionSpecific,
    joinField,
    parentFieldName,
    relatedCollections: {},
    slugify,
    slugPathFieldName,
    titlePathFieldName,
  }
}
