import type { CollectionConfig, SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'
import type {
  JoinField,
  Option,
  RelationshipField,
  SelectField,
  Validate,
} from '../fields/config/types.js'
import type { Document } from '../types/index.js'
import type { SanitizedHierarchyConfig, SanitizedHierarchyRelatedCollection } from './types.js'

import { sanitizeJoinField } from '../fields/config/sanitizeJoinField.js'
import { fieldAffectsData } from '../fields/config/types.js'
import { extractID } from '../utilities/extractID.js'
import { flattenAllFields } from '../utilities/flattenAllFields.js'
import { getHierarchyFieldName } from './constants.js'
import { hierarchyCollectionAfterDelete } from './hooks/collectionAfterDelete.js'
import { injectHierarchyButton } from './injectHierarchyButton.js'

/**
 * Resolves hierarchy relationships across collections.
 *
 * This function runs after individual collection sanitization to establish
 * cross-collection hierarchy relationships. It discovers which collections
 * reference each hierarchy and configures the necessary fields, components,
 * and hooks.
 *
 * @remarks
 * Must be called after all collections are sanitized.
 *
 * **What it does:**
 * - Discovers related collections by scanning for hierarchy relationship fields
 * - Injects `HierarchyButton` component when `custom.hierarchy.injectHeaderButton` is set
 * - Adds `collectionSpecific` validation to ensure hierarchy items accept the document type
 * - Injects the `hierarchyType` select field when `collectionSpecific` is enabled
 * - Injects join field when `joinField` is configured
 * - Adds `afterDelete` hook to clear hierarchy references when items are deleted
 * - Populates `relatedCollections` in the sanitized hierarchy config
 */
export const resolveHierarchyCollections = (config: Config): void => {
  const hierarchyCollections =
    config.collections?.filter((col) => col.hierarchy && typeof col.hierarchy === 'object') || []

  for (const hierarchyCollection of hierarchyCollections) {
    const hierarchy = hierarchyCollection.hierarchy

    // TypeScript guard - hierarchy is guaranteed to be an object by the filter above
    if (!hierarchy || typeof hierarchy !== 'object') {
      continue
    }

    const hierarchyConfig = hierarchy as SanitizedHierarchyConfig
    const defaultFieldName = getHierarchyFieldName(hierarchyCollection.slug)
    const parentFieldName = hierarchyConfig.parentFieldName ?? defaultFieldName
    const isParentFieldNameOverridden = parentFieldName !== defaultFieldName
    const collectionSpecific = hierarchyConfig.collectionSpecific
    const typeFieldName = collectionSpecific ? collectionSpecific.fieldName : undefined
    const allowHasMany = hierarchyConfig.allowHasMany ?? true

    // Build relatedCollections by scanning all collections for hierarchy fields
    const sanitizedRelatedCollections: Record<string, SanitizedHierarchyRelatedCollection> = {}

    const selfParentField = hierarchyCollection.fields.find(
      (field) =>
        fieldAffectsData(field) &&
        field.name === parentFieldName &&
        field.type === 'relationship' &&
        (field as RelationshipField).relationTo === hierarchyCollection.slug,
    ) as RelationshipField | undefined

    // Check if the hierarchy collection's own parent field should be replaced with a header button
    if (selfParentField?.custom?.hierarchy?.injectHeaderButton === true) {
      injectHierarchyButton({
        collection: hierarchyCollection,
        fieldName: parentFieldName,
        hierarchyCollectionSlug: hierarchyCollection.slug,
        parentFieldName: hierarchyConfig.parentFieldName,
      })
    }

    for (const collection of config.collections || []) {
      // Skip the hierarchy collection itself (handled above)
      if (collection.slug === hierarchyCollection.slug) {
        continue
      }

      // Find hierarchy field by the default name (what createFolderField uses)
      const hierarchyField = collection.fields.find(
        (field) =>
          fieldAffectsData(field) &&
          field.name === defaultFieldName &&
          field.type === 'relationship' &&
          (field as RelationshipField).relationTo === hierarchyCollection.slug,
      ) as RelationshipField | undefined

      // If parentFieldName is overridden, rename the field to match
      if (hierarchyField && isParentFieldNameOverridden) {
        hierarchyField.name = parentFieldName
      }

      if (!hierarchyField) {
        continue
      }

      const fieldHasMany = hierarchyField.hasMany ?? allowHasMany

      // If collectionSpecific, inject validation to check hierarchy allows this collection type
      if (collectionSpecific) {
        injectCollectionSpecificValidation({
          hierarchyField,
          hierarchySlug: hierarchyCollection.slug,
          typeFieldName: typeFieldName!,
        })
      }

      // Store discovered collection with hasMany info
      sanitizedRelatedCollections[collection.slug] = {
        fieldName: parentFieldName,
        hasMany: fieldHasMany,
      }

      // Inject HierarchyButton if field requests it
      if (hierarchyField.custom?.hierarchy?.injectHeaderButton === true) {
        injectHierarchyButton({
          collection,
          fieldName: parentFieldName,
          hierarchyCollectionSlug: hierarchyCollection.slug,
          parentFieldName: hierarchyConfig.parentFieldName,
        })
      }
    }

    // If collectionSpecific, add type field to hierarchy collection
    if (hierarchyConfig.collectionSpecific) {
      injectTypeField({
        config,
        hierarchyCollection: hierarchyCollection as SanitizedCollectionConfig,
        parentFieldName: hierarchyConfig.parentFieldName,
        sanitizedRelatedCollections,
        typeFieldName: hierarchyConfig.collectionSpecific.fieldName,
      })
    }

    // If joinField is configured, add the join field to query children
    if (hierarchyConfig.joinField) {
      injectJoinField({
        config,
        hierarchyCollection: hierarchyCollection as SanitizedCollectionConfig,
        joinFieldName: hierarchyConfig.joinField.fieldName,
        parentFieldName,
        relatedSlugs: Object.keys(sanitizedRelatedCollections),
      })
    }

    // Update hierarchy config with sanitized relatedCollections
    if (hierarchyConfig) {
      hierarchyConfig.relatedCollections = sanitizedRelatedCollections
    }

    // Add afterDelete hook to clear folder references from related documents
    if (Object.keys(sanitizedRelatedCollections).length > 0) {
      injectAfterDeleteHook({
        hierarchyCollection: hierarchyCollection as SanitizedCollectionConfig,
        sanitizedRelatedCollections,
      })
    }

    // Add sidebar tab for this hierarchy collection
    injectSidebarTab({
      config,
      hierarchyCollection,
      hierarchyConfig,
    })
  }
}

/**
 * Injects validation for collectionSpecific hierarchy fields.
 * Ensures the selected hierarchy item allows documents of this collection type.
 */
function injectCollectionSpecificValidation({
  hierarchyField,
  hierarchySlug,
  typeFieldName,
}: {
  hierarchyField: RelationshipField
  hierarchySlug: string
  typeFieldName: string
}): void {
  const existingValidate = hierarchyField.validate

  const validate: Validate<unknown> = async (value, options) => {
    // Run existing validation first if present
    if (existingValidate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingResult = await existingValidate(value as any, options as any)
      if (existingResult !== true) {
        return existingResult
      }
    }

    // No hierarchy selected, no validation needed
    if (!value) {
      return true
    }

    const { collectionSlug, overrideAccess, previousValue, req } = options
    const newID = extractID<Document>(value)

    // Value didn't change, no validation needed
    if (previousValue && extractID<Document>(previousValue) === newID) {
      return true
    }

    // Fetch the hierarchy item to check its type field
    let parentItem: Document | null = null
    if (typeof newID === 'string' || typeof newID === 'number') {
      try {
        parentItem = await req.payload.findByID({
          id: newID,
          collection: hierarchySlug,
          depth: 0,
          overrideAccess: overrideAccess ?? false,
          req,
          select: { [typeFieldName]: true },
        })
      } catch {
        return `Hierarchy item with ID ${newID} not found`
      }
    }

    if (!parentItem) {
      return `Hierarchy item with ID ${newID} not found`
    }

    const allowedTypes: string[] = (parentItem[typeFieldName] as string[]) || []

    // If hierarchy has no types, it accepts all collections
    if (allowedTypes.length === 0) {
      return true
    }

    // Check if this collection is allowed
    if (collectionSlug && allowedTypes.includes(collectionSlug)) {
      return true
    }

    return `Hierarchy item "${newID}" does not allow documents of type "${collectionSlug}"`
  }

  hierarchyField.validate = validate
}

/**
 * Injects the hierarchyType select field into a hierarchy collection.
 */
function injectTypeField({
  config,
  hierarchyCollection,
  parentFieldName,
  sanitizedRelatedCollections,
  typeFieldName,
}: {
  config: Config
  hierarchyCollection: CollectionConfig | SanitizedCollectionConfig
  parentFieldName: string
  sanitizedRelatedCollections: Record<string, SanitizedHierarchyRelatedCollection>
  typeFieldName: string
}): void {
  const collectionOptions: Option[] = Object.keys(sanitizedRelatedCollections).map((slug) => {
    const relatedCollection = config.collections?.find((c) => c.slug === slug)
    return {
      label: relatedCollection?.labels?.plural || slug,
      value: slug,
    }
  })

  const typeField: SelectField = {
    name: typeFieldName,
    type: 'select',
    admin: {
      components: {
        Field: {
          path: '@payloadcms/next/rsc#HierarchyTypeFieldServer',
          serverProps: {
            collectionOptions,
            parentFieldName,
          },
        },
      },
      position: 'sidebar',
    },
    hasMany: true,
    options: collectionOptions,
  }

  hierarchyCollection.fields = hierarchyCollection.fields || []
  hierarchyCollection.fields.push(typeField)
}

/**
 * Injects a join field to query all children of a hierarchy item.
 */
function injectJoinField({
  config,
  hierarchyCollection,
  joinFieldName,
  parentFieldName,
  relatedSlugs,
}: {
  config: Config
  hierarchyCollection: SanitizedCollectionConfig
  joinFieldName: string
  parentFieldName: string
  relatedSlugs: string[]
}): void {
  const hasJoinField = hierarchyCollection.fields?.some(
    (field) => 'name' in field && field.name === joinFieldName,
  )

  if (hasJoinField) {
    return
  }

  const joinField: JoinField = {
    name: joinFieldName,
    type: 'join',
    collection: [hierarchyCollection.slug, ...relatedSlugs],
    hasMany: true,
    on: parentFieldName,
  }

  hierarchyCollection.fields = hierarchyCollection.fields || []
  hierarchyCollection.fields.push(joinField)

  // Sanitize the join field to register it properly
  sanitizeJoinField({
    config,
    field: joinField,
    joins: hierarchyCollection.joins,
    parentIsLocalized: false,
    polymorphicJoins: hierarchyCollection.polymorphicJoins,
  })

  // Recompute flattenedFields since we added a field after initial sanitization
  hierarchyCollection.flattenedFields = flattenAllFields({
    fields: hierarchyCollection.fields,
  })
}

/**
 * Injects afterDelete hook to clear hierarchy references from related documents.
 */
function injectAfterDeleteHook({
  hierarchyCollection,
  sanitizedRelatedCollections,
}: {
  hierarchyCollection: CollectionConfig | SanitizedCollectionConfig
  sanitizedRelatedCollections: Record<string, SanitizedHierarchyRelatedCollection>
}): void {
  // Build map of collection slugs to their field names
  const relatedCollectionFieldMap: Record<string, string> = {}
  for (const [slug, relatedConfig] of Object.entries(sanitizedRelatedCollections)) {
    relatedCollectionFieldMap[slug] = relatedConfig.fieldName
  }

  hierarchyCollection.hooks = hierarchyCollection.hooks || {}
  hierarchyCollection.hooks.afterDelete = [
    ...(hierarchyCollection.hooks.afterDelete || []),
    hierarchyCollectionAfterDelete({ relatedCollections: relatedCollectionFieldMap }),
  ]
}

/**
 * Injects a sidebar tab for a hierarchy collection.
 */
function injectSidebarTab({
  config,
  hierarchyCollection,
  hierarchyConfig,
}: {
  config: Config
  hierarchyCollection: CollectionConfig
  hierarchyConfig: SanitizedHierarchyConfig
}): void {
  const tabSlug = `hierarchy-${hierarchyCollection.slug}`
  const Icon = hierarchyConfig.admin.components.Icon

  // Initialize admin config structure
  config.admin = config.admin || {}
  config.admin.components = config.admin.components || {}
  config.admin.components.sidebar = config.admin.components.sidebar || {}
  config.admin.components.sidebar.tabs = config.admin.components.sidebar.tabs || []

  // Check if tab already exists
  const hasTab = config.admin.components.sidebar.tabs.some((tab) => tab.slug === tabSlug)

  if (!hasTab) {
    config.admin.components.sidebar.tabs.push({
      slug: tabSlug,
      components: {
        Content: {
          clientProps: {
            collectionSlug: hierarchyCollection.slug,
          },
          path: '@payloadcms/ui/rsc#HierarchySidebarTabServer',
        },
        Icon,
      },
      label: hierarchyCollection.labels?.plural || hierarchyCollection.slug,
    })
  }
}
