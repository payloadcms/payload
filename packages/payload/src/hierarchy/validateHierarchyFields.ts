import type { Config } from '../config/types.js'
import type { Option, RelationshipField, SelectField, Validate } from '../fields/config/types.js'
import type { Document } from '../types/index.js'
import type { SanitizedHierarchyConfig, SanitizedHierarchyRelatedCollection } from './types.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { extractID } from '../utilities/extractID.js'
import { getHierarchyFieldName } from './constants.js'

/**
 * Discover and validate hierarchy fields in related collections.
 * Must be called after all collections are sanitized.
 *
 * This function:
 * 1. Auto-discovers related collections by scanning for hierarchy fields
 * 2. If collectionSpecific is enabled, injects validation to check hierarchy allows the collection type
 * 3. If field has custom.hierarchy.injectHeaderButton, injects the HierarchyBeforeDocumentControls component
 * 4. Builds the sanitized relatedCollections config with field info
 */
export const validateHierarchyFields = (config: Config): void => {
  const hierarchyCollections =
    config.collections?.filter((col) => col.hierarchy && typeof col.hierarchy === 'object') || []

  for (const hierarchyCollection of hierarchyCollections) {
    const hierarchy = hierarchyCollection.hierarchy

    // TypeScript guard - hierarchy is guaranteed to be an object by the filter above
    if (!hierarchy || typeof hierarchy !== 'object') {
      continue
    }

    const expectedFieldName = getHierarchyFieldName(hierarchyCollection.slug)
    const collectionSpecific = (hierarchy as SanitizedHierarchyConfig).collectionSpecific ?? false
    const allowHasMany = (hierarchy as SanitizedHierarchyConfig).allowHasMany ?? true

    // Build relatedCollections by scanning all collections for hierarchy fields
    const sanitizedRelatedCollections: Record<string, SanitizedHierarchyRelatedCollection> = {}

    for (const collection of config.collections || []) {
      // Skip the hierarchy collection itself
      if (collection.slug === hierarchyCollection.slug) {
        continue
      }

      // Find hierarchy field in this collection
      const hierarchyField = collection.fields.find(
        (field) =>
          fieldAffectsData(field) &&
          field.name === expectedFieldName &&
          field.type === 'relationship' &&
          (field as RelationshipField).relationTo === hierarchyCollection.slug,
      ) as RelationshipField | undefined

      if (!hierarchyField) {
        continue
      }

      const fieldHasMany = hierarchyField.hasMany ?? allowHasMany

      // If collectionSpecific, inject validation to check hierarchy allows this collection type
      if (collectionSpecific) {
        const hierarchySlug = hierarchyCollection.slug
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

          // Fetch the hierarchy item to check its hierarchyType
          let parentItem: Document | null = null
          if (typeof newID === 'string' || typeof newID === 'number') {
            try {
              parentItem = await req.payload.findByID({
                id: newID,
                collection: hierarchySlug,
                depth: 0,
                overrideAccess: overrideAccess ?? false,
                req,
                select: { hierarchyType: true },
              })
            } catch {
              return `Hierarchy item with ID ${newID} not found`
            }
          }

          if (!parentItem) {
            return `Hierarchy item with ID ${newID} not found`
          }

          const hierarchyTypes: string[] = (parentItem.hierarchyType as string[]) || []

          // If hierarchy has no types, it accepts all collections
          if (hierarchyTypes.length === 0) {
            return true
          }

          // Check if this collection is allowed
          if (collectionSlug && hierarchyTypes.includes(collectionSlug)) {
            return true
          }

          return `Hierarchy item "${newID}" does not allow documents of type "${collectionSlug}"`
        }

        hierarchyField.validate = validate
      }

      // Store discovered collection with hasMany info
      sanitizedRelatedCollections[collection.slug] = {
        fieldName: expectedFieldName,
        hasMany: fieldHasMany,
      }

      // Check if field requests header button injection via custom marker
      const injectHeaderButton = hierarchyField.custom?.hierarchy?.injectHeaderButton === true

      if (injectHeaderButton) {
        // Inject HierarchyBeforeDocumentControls component
        collection.admin = collection.admin || {}
        collection.admin.components = collection.admin.components || {}
        collection.admin.components.edit = collection.admin.components.edit || {}

        const hierarchyComponent = '@payloadcms/ui/rsc#HierarchyBeforeDocumentControls'
        const existingComponents = collection.admin.components.edit.beforeDocumentControls || []
        const hasHierarchy = existingComponents.some((c) => {
          if (typeof c === 'string') {
            return c === hierarchyComponent
          }
          if (c && typeof c === 'object' && 'path' in c) {
            return c.path === hierarchyComponent
          }
          return false
        })

        if (!hasHierarchy) {
          collection.admin.components.edit.beforeDocumentControls = [
            hierarchyComponent,
            ...existingComponents,
          ]
        }
      }
    }

    // If collectionSpecific, add hierarchyType field to hierarchy collection
    if (collectionSpecific) {
      const hasHierarchyTypeField = hierarchyCollection.fields?.some(
        (field) => 'name' in field && field.name === 'hierarchyType',
      )

      if (!hasHierarchyTypeField) {
        const collectionOptions: Option[] = Object.keys(sanitizedRelatedCollections).map((slug) => {
          const relatedCollection = config.collections?.find((c) => c.slug === slug)
          return {
            label: relatedCollection?.labels?.plural || slug,
            value: slug,
          }
        })

        const hierarchyTypeField: SelectField = {
          name: 'hierarchyType',
          type: 'select',
          admin: {
            components: {
              Field: {
                path: '@payloadcms/next/client#HierarchyTypeField',
              },
            },
            position: 'sidebar',
          },
          hasMany: true,
          options: collectionOptions,
        }

        hierarchyCollection.fields = hierarchyCollection.fields || []
        hierarchyCollection.fields.push(hierarchyTypeField)
      }
    }

    // Update hierarchy config with sanitized relatedCollections
    const hierarchyConfig = hierarchyCollection.hierarchy as SanitizedHierarchyConfig | undefined
    if (hierarchyConfig) {
      hierarchyConfig.relatedCollections = sanitizedRelatedCollections
    }
  }
}
