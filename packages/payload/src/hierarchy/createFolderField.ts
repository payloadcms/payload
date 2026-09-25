import type { RelationshipField, SingleRelationshipField } from '../fields/config/types.js'

import { getHierarchyFieldName } from './constants.js'

/**
 * Options for creating a folder relationship field.
 * All SingleRelationshipField properties are available except name, type, relationTo, and hasMany
 * which are managed by the folder system.
 */
export type CreateFolderFieldOptions = {
  /**
   * The slug of the hierarchy collection this field references (e.g., 'folders')
   */
  relationTo: string
} & Pick<Partial<SingleRelationshipField>, 'admin' | 'label' | 'required'>

/**
 * Creates a relationship field for folder-style hierarchies (single-select).
 *
 * This field:
 * - Has hasMany:false (single folder selection)
 * - Uses NullField to render nothing in the form (no DOM output)
 * - Injects a header button for folder selection via miller columns UI
 *
 * Use this in your collection's fields array to add a folder relationship.
 * The field name is automatically generated based on the hierarchy slug.
 *
 * @example
 * import { createFolderField } from 'payload'
 *
 * const Posts: CollectionConfig = {
 *   slug: 'posts',
 *   fields: [
 *     { name: 'title', type: 'text' },
 *     createFolderField({
 *       relationTo: 'folders',
 *       label: 'Folder',
 *     }),
 *   ],
 * }
 */
export function createFolderField(options: CreateFolderFieldOptions): RelationshipField {
  const { admin: adminOverrides, label, relationTo, ...restOptions } = options
  const { components: componentOverrides, ...restAdminOverrides } = adminOverrides || {}

  return {
    name: getHierarchyFieldName(relationTo),
    type: 'relationship',
    admin: {
      position: 'sidebar',
      ...restAdminOverrides,
      components: {
        // NullField renders nothing - the header button handles the UI
        Field: '@payloadcms/ui#NullField',
        ...componentOverrides,
      },
    },
    custom: {
      hierarchy: {
        injectHeaderButton: true,
      },
    },
    hasMany: false,
    index: true,
    label: label ?? 'Folder',
    relationTo,
    ...restOptions,
  } as RelationshipField
}
