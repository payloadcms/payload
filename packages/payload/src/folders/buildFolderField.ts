import type { SingleRelationshipField } from '../fields/config/types.js'
import type { Document } from '../types/index.js'

import { APIError } from '../errors/APIError.js'
import { extractID } from '../utilities/extractID.js'

export const buildFolderField = ({
  folderFieldName,
  folderSlug,
  overrides = {},
}: {
  folderFieldName: string
  folderSlug: string
  overrides?: Partial<SingleRelationshipField>
}): SingleRelationshipField => {
  const field: SingleRelationshipField = {
    name: folderFieldName,
    type: 'relationship',
    admin: {},
    hasMany: false,
    index: true,
    label: 'Folder',
    relationTo: folderSlug,
    validate: async (value, { collectionSlug, data, previousValue, req }) => {
      if (!value) {
        // no folder, no validation required
        return true
      }

      const newID = extractID<Document>(value)
      if (previousValue && extractID<Document>(previousValue) === newID) {
        // value did not change, no validation required
        return true
      } else {
        // need to validat the folder value allows this collection type
        let parentFolder: Document = null
        if (typeof value === 'string' || typeof value === 'number') {
          // need to populate the value with the document
          parentFolder = await req.payload.findByID({
            id: newID,
            collection: folderSlug,
            depth: 0, // no need to populate nested folders
            overrideAccess: false,
            select: {
              assignedCollections: true, // only need to check assignedCollections
            },
            user: req.user,
          })
        }

        if (parentFolder && collectionSlug) {
          const parentAssignedCollectionSlugs: string[] =
            (parentFolder.assignedCollections as string[]) || []

          // validation for a folder document
          if (collectionSlug === folderSlug) {
            // ensure the parent accepts ALL assigned collections
            const folderAssignedCollections: string[] =
              'assignedCollections' in data ? (data.assignedCollections as string[]) : []
            const invalidSlugs = folderAssignedCollections.filter((assignedCollection: string) => {
              return !parentAssignedCollectionSlugs.includes(assignedCollection)
            })
            if (invalidSlugs.length === 0) {
              return true
            } else {
              return `Folder with ID ${newID} does not allow documents of type ${invalidSlugs.join(', ')}`
            }
          }

          // validation for a non-folder document
          if (parentAssignedCollectionSlugs.includes(collectionSlug)) {
            return true
          } else {
            return `Folder with ID ${newID} does not allow documents of type ${collectionSlug}`
          }
        } else {
          return `Folder with ID ${newID} not found in collection ${folderSlug}`
        }
      }
    },
  }

  if (overrides?.admin) {
    field.admin = {
      ...field.admin,
      ...(overrides.admin || {}),
    }

    if (overrides.admin.components) {
      field.admin.components = {
        ...field.admin.components,
        ...(overrides.admin.components || {}),
      }
    }
  }

  return field
}
