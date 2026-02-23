import type { Config } from '../config/types.js'
import type { Option, RelationshipField, SelectField, Validate } from '../fields/config/types.js'
import type { SanitizedRelatedCollection, SanitizedTaxonomyConfig } from '../taxonomy/types.js'
import type { Document } from '../types/index.js'

import { fieldAffectsData } from '../fields/config/types.js'
import { extractID } from '../utilities/extractID.js'
import { getFolderFieldName } from './constants.js'

/**
 * Discover and validate folder fields in related collections.
 * Must be called after all collections are sanitized.
 *
 * This function:
 * 1. Auto-discovers related collections by scanning for folder fields
 * 2. If collectionSpecific is enabled, injects validation to check folder allows the collection type
 * 3. Builds the sanitized relatedCollections config with field info
 */
export const validateFolderFields = (config: Config): void => {
  const folderCollections =
    config.collections?.filter((col) => col.folder && typeof col.folder === 'object') || []

  for (const folderCollection of folderCollections) {
    const folder = folderCollection.folder

    // TypeScript guard - folder is guaranteed to be an object by the filter above
    if (!folder || typeof folder !== 'object') {
      continue
    }

    const expectedFieldName = getFolderFieldName(folderCollection.slug)
    const collectionSpecific = folder.collectionSpecific ?? false

    // Build relatedCollections by scanning all collections for folder fields
    const sanitizedRelatedCollections: Record<string, SanitizedRelatedCollection> = {}

    for (const collection of config.collections || []) {
      // Skip the folder collection itself
      if (collection.slug === folderCollection.slug) {
        continue
      }

      // Find folder field in this collection
      const folderField = collection.fields.find(
        (field) =>
          fieldAffectsData(field) &&
          field.name === expectedFieldName &&
          field.type === 'relationship' &&
          (field as RelationshipField).relationTo === folderCollection.slug,
      ) as RelationshipField | undefined

      if (!folderField) {
        continue
      }

      // If collectionSpecific, inject validation to check folder allows this collection type
      if (collectionSpecific) {
        const folderSlug = folderCollection.slug
        const existingValidate = folderField.validate

        const validate: Validate<unknown> = async (value, options) => {
          // Run existing validation first if present
          if (existingValidate) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const existingResult = await existingValidate(value as any, options as any)
            if (existingResult !== true) {
              return existingResult
            }
          }

          // No folder selected, no validation needed
          if (!value) {
            return true
          }

          const { collectionSlug, overrideAccess, previousValue, req } = options
          const newID = extractID<Document>(value)

          // Value didn't change, no validation needed
          if (previousValue && extractID<Document>(previousValue) === newID) {
            return true
          }

          // Fetch the folder to check its folderType
          let parentFolder: Document | null = null
          if (typeof newID === 'string' || typeof newID === 'number') {
            try {
              parentFolder = await req.payload.findByID({
                id: newID,
                collection: folderSlug,
                depth: 0,
                overrideAccess: overrideAccess ?? false,
                req,
                select: { folderType: true },
              })
            } catch {
              return `Folder with ID ${newID} not found`
            }
          }

          if (!parentFolder) {
            return `Folder with ID ${newID} not found`
          }

          const folderTypes: string[] = (parentFolder.folderType as string[]) || []

          // If folder has no types, it accepts all collections
          if (folderTypes.length === 0) {
            return true
          }

          // Check if this collection is allowed
          if (collectionSlug && folderTypes.includes(collectionSlug)) {
            return true
          }

          return `Folder "${newID}" does not allow documents of type "${collectionSlug}"`
        }

        folderField.validate = validate
      }

      // Store discovered collection (folders always use hasMany: false)
      sanitizedRelatedCollections[collection.slug] = {
        fieldName: expectedFieldName,
        hasMany: false,
      }
    }

    // If collectionSpecific, add folderType field to folder collection
    if (collectionSpecific) {
      const hasFolderTypeField = folderCollection.fields?.some(
        (field) => 'name' in field && field.name === 'folderType',
      )

      if (!hasFolderTypeField) {
        const collectionOptions: Option[] = Object.keys(sanitizedRelatedCollections).map((slug) => {
          const relatedCollection = config.collections?.find((c) => c.slug === slug)
          return {
            label: relatedCollection?.labels?.plural || slug,
            value: slug,
          }
        })

        const folderTypeField: SelectField = {
          name: 'folderType',
          type: 'select',
          admin: {
            components: {
              Field: {
                path: '@payloadcms/next/client#FolderTypeField',
              },
            },
            position: 'sidebar',
          },
          hasMany: true,
          options: collectionOptions,
        }

        folderCollection.fields = folderCollection.fields || []
        folderCollection.fields.push(folderTypeField)
      }
    }

    // Update taxonomy config with sanitized relatedCollections
    // (taxonomy config is set in sanitizeFolder for list view rendering)
    const taxonomy = folderCollection.taxonomy as SanitizedTaxonomyConfig | undefined
    if (taxonomy) {
      taxonomy.relatedCollections = sanitizedRelatedCollections
    }
  }
}
