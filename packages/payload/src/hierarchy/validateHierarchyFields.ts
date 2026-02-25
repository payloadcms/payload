import type { SanitizedCollectionConfig } from '../collections/config/types.js'
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

/**
 * Discover and validate hierarchy fields in related collections.
 * Must be called after all collections are sanitized.
 *
 * This function:
 * 1. Auto-discovers related collections by scanning for hierarchy fields
 * 2. If collectionSpecific is enabled, injects validation to check hierarchy allows the collection type
 * 3. If field has custom.hierarchy.injectHeaderButton, injects HierarchyButton into BeforeDocumentMeta slot
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

    const hierarchyConfig = hierarchy as SanitizedHierarchyConfig
    const defaultFieldName = getHierarchyFieldName(hierarchyCollection.slug)
    const parentFieldName = hierarchyConfig.parentFieldName ?? defaultFieldName
    const isParentFieldNameOverridden = parentFieldName !== defaultFieldName
    const collectionSpecific = hierarchyConfig.collectionSpecific
    const typeFieldName = collectionSpecific ? collectionSpecific.fieldName : undefined
    const allowHasMany = hierarchyConfig.allowHasMany ?? true

    // Build relatedCollections by scanning all collections for hierarchy fields
    const sanitizedRelatedCollections: Record<string, SanitizedHierarchyRelatedCollection> = {}

    // Check if the hierarchy collection's own parent field needs header button
    const selfParentField = hierarchyCollection.fields.find(
      (field) =>
        fieldAffectsData(field) &&
        field.name === parentFieldName &&
        field.type === 'relationship' &&
        (field as RelationshipField).relationTo === hierarchyCollection.slug,
    ) as RelationshipField | undefined

    if (selfParentField?.custom?.hierarchy?.injectHeaderButton === true) {
      hierarchyCollection.admin = hierarchyCollection.admin || {}
      hierarchyCollection.admin.components = hierarchyCollection.admin.components || {}
      hierarchyCollection.admin.components.edit = hierarchyCollection.admin.components.edit || {}

      const hierarchyComponent = {
        path: '@payloadcms/ui/rsc#HierarchyButton',
        serverProps: {
          collectionSlug: hierarchyCollection.slug,
          fieldName: parentFieldName,
          parentFieldName: hierarchyConfig.parentFieldName,
        },
      }

      const existingComponents = hierarchyCollection.admin.components.edit.BeforeDocumentMeta || []
      const componentPath = '@payloadcms/ui/rsc#HierarchyButton'
      const alreadyInjected = existingComponents.some((c) => {
        if (typeof c === 'string') {
          return c === componentPath
        }
        if (c && typeof c === 'object' && 'path' in c) {
          return c.path === componentPath
        }
        return false
      })

      if (!alreadyInjected) {
        hierarchyCollection.admin.components.edit.BeforeDocumentMeta = [
          hierarchyComponent,
          ...existingComponents,
        ]
      }
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
                select: { [typeFieldName!]: true },
              })
            } catch {
              return `Hierarchy item with ID ${newID} not found`
            }
          }

          if (!parentItem) {
            return `Hierarchy item with ID ${newID} not found`
          }

          const allowedTypes: string[] = (parentItem[typeFieldName!] as string[]) || []

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

      // Store discovered collection with hasMany info
      sanitizedRelatedCollections[collection.slug] = {
        fieldName: parentFieldName,
        hasMany: fieldHasMany,
      }

      // Inject HierarchyButton if field requests it
      const injectHeaderButton = hierarchyField.custom?.hierarchy?.injectHeaderButton === true

      if (injectHeaderButton) {
        collection.admin = collection.admin || {}
        collection.admin.components = collection.admin.components || {}
        collection.admin.components.edit = collection.admin.components.edit || {}

        const hierarchyComponent = {
          path: '@payloadcms/ui/rsc#HierarchyButton',
          serverProps: {
            collectionSlug: hierarchyCollection.slug,
            fieldName: parentFieldName,
            parentFieldName: hierarchyConfig.parentFieldName,
          },
        }

        const existingComponents = collection.admin.components.edit.BeforeDocumentMeta || []
        const componentPath = '@payloadcms/ui/rsc#HierarchyButton'
        const alreadyInjected = existingComponents.some((c) => {
          if (typeof c === 'string') {
            return c === componentPath
          }
          if (c && typeof c === 'object' && 'path' in c) {
            return c.path === componentPath
          }
          return false
        })

        if (!alreadyInjected) {
          collection.admin.components.edit.BeforeDocumentMeta = [
            hierarchyComponent,
            ...existingComponents,
          ]
        }
      }
    }

    // If collectionSpecific, add type field to hierarchy collection
    if (hierarchyConfig.collectionSpecific) {
      const typeFieldName = hierarchyConfig.collectionSpecific.fieldName
      const hasTypeField = hierarchyCollection.fields?.some(
        (field) => 'name' in field && field.name === typeFieldName,
      )

      if (!hasTypeField) {
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
                  parentFieldName: hierarchyConfig.parentFieldName,
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
    }

    // If joinField is configured, add the join field to query children
    if (hierarchyConfig.joinField) {
      const relatedSlugs = Object.keys(sanitizedRelatedCollections)
      const joinFieldName = hierarchyConfig.joinField.fieldName

      const hasJoinField = hierarchyCollection.fields?.some(
        (field) => 'name' in field && field.name === joinFieldName,
      )

      if (!hasJoinField) {
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
        const sanitizedCollection = hierarchyCollection as unknown as SanitizedCollectionConfig
        sanitizeJoinField({
          config,
          field: joinField,
          joins: sanitizedCollection.joins,
          parentIsLocalized: false,
          polymorphicJoins: sanitizedCollection.polymorphicJoins,
        })

        // Recompute flattenedFields since we added a field after initial sanitization
        sanitizedCollection.flattenedFields = flattenAllFields({
          fields: sanitizedCollection.fields,
        })
      }
    }

    // Update hierarchy config with sanitized relatedCollections
    if (hierarchyConfig) {
      hierarchyConfig.relatedCollections = sanitizedRelatedCollections
    }

    // Add afterDelete hook to clear folder references from related documents
    if (Object.keys(sanitizedRelatedCollections).length > 0) {
      // Build map of collection slugs to their field names
      const relatedCollectionFieldMap: Record<string, string> = {}
      for (const [slug, config] of Object.entries(sanitizedRelatedCollections)) {
        relatedCollectionFieldMap[slug] = config.fieldName
      }

      hierarchyCollection.hooks = hierarchyCollection.hooks || {}
      hierarchyCollection.hooks.afterDelete = [
        ...(hierarchyCollection.hooks.afterDelete || []),
        hierarchyCollectionAfterDelete({ relatedCollections: relatedCollectionFieldMap }),
      ]
    }
  }
}
