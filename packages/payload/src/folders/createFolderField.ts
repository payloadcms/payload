import type { RelationshipField, SingleRelationshipField } from '../fields/config/types.js'

/**
 * Options for creating a folder relationship field.
 * All SingleRelationshipField properties are available except name, type, and relationTo
 * which are managed by the folder system.
 */
export type CreateFolderFieldOptions = {
  /**
   * Custom name for the folder field
   * @default 'folder'
   */
  name?: string
  /**
   * The slug of the folder collection this field references
   */
  relationTo: string
} & Pick<Partial<SingleRelationshipField>, 'admin' | 'hasMany' | 'label' | 'required'>

/**
 * Creates a relationship field that references a folder collection.
 *
 * Use this in your collection's fields array to add a folder relationship.
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
  const {
    name = 'folder',
    admin: adminOverrides,
    label = 'Folder',
    relationTo,
    ...restOptions
  } = options
  const { components: componentOverrides, ...restAdminOverrides } = adminOverrides || {}

  return {
    name,
    type: 'relationship',
    admin: {
      components: {
        Field: '@payloadcms/ui/rsc#FolderField',
        ...componentOverrides,
      },
      position: 'sidebar',
      ...restAdminOverrides,
    },
    hasMany: false,
    index: true,
    label,
    relationTo,
    ...restOptions,
  } as RelationshipField
}
