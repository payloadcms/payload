import type { RelationshipField, SingleRelationshipField } from '../fields/config/types.js'

import { getFolderFieldName } from './constants.js'

/**
 * Options for creating a folder relationship field.
 * All SingleRelationshipField properties are available except name, type, and relationTo
 * which are managed by the folder system.
 */
export type CreateFolderFieldOptions = {
  /**
   * The slug of the folder collection this field references
   */
  folderSlug: string
} & Pick<Partial<SingleRelationshipField>, 'admin' | 'label' | 'required'>

/**
 * Creates a relationship field that references a folder collection.
 *
 * Use this in your collection's fields array to add a folder relationship.
 * The field name is automatically generated based on the folder slug.
 *
 * @example
 * import { createFolderField } from 'payload'
 *
 * const Posts: CollectionConfig = {
 *   slug: 'posts',
 *   fields: [
 *     { name: 'title', type: 'text' },
 *     createFolderField({
 *       folderSlug: 'folders',
 *       label: 'Folder',
 *     }),
 *   ],
 * }
 */
export function createFolderField(options: CreateFolderFieldOptions): RelationshipField {
  const { admin: adminOverrides, folderSlug, label, ...restOptions } = options

  return {
    name: getFolderFieldName(folderSlug),
    type: 'relationship',
    admin: {
      position: 'sidebar',
      ...adminOverrides,
    },
    hasMany: false,
    index: true,
    label: label ?? 'Folder',
    relationTo: folderSlug,
    ...restOptions,
  } as RelationshipField
}
