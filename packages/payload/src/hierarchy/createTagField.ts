import type { RelationshipField } from '../fields/config/types.js'

import { getHierarchyFieldName } from './constants.js'

/**
 * Options for creating a tag relationship field.
 * All RelationshipFieldMany properties are available except name, type, and relationTo
 * which are managed by the tag system.
 */
export type CreateTagFieldOptions = {
  /**
   * Whether to allow multiple tags (defaults to true)
   * @default true
   */
  hasMany?: boolean
  /**
   * The slug of the hierarchy collection this field references (e.g., 'tags')
   */
  relationTo: string
} & Pick<Partial<RelationshipField>, 'admin' | 'label' | 'required'>

/**
 * Creates a relationship field for tag-style hierarchies (multi-select by default).
 *
 * This field:
 * - Has hasMany:true by default (multiple tag selection)
 * - Is positioned in the sidebar by default
 * - Does NOT inject a header button (tags use standard relationship UI)
 *
 * Use this in your collection's fields array to add a tag relationship.
 * The field name is automatically generated based on the hierarchy slug.
 *
 * @example
 * import { createTagField } from 'payload'
 *
 * const Posts: CollectionConfig = {
 *   slug: 'posts',
 *   fields: [
 *     { name: 'title', type: 'text' },
 *     createTagField({
 *       relationTo: 'tags',
 *       label: 'Tags',
 *     }),
 *   ],
 * }
 */
export function createTagField(options: CreateTagFieldOptions): RelationshipField {
  const { admin: adminOverrides, hasMany = true, label, relationTo, ...restOptions } = options
  const { components: componentOverrides, ...restAdminOverrides } = adminOverrides || {}

  return {
    name: getHierarchyFieldName(relationTo),
    type: 'relationship',
    admin: {
      position: 'sidebar',
      ...restAdminOverrides,
      components: {
        ...componentOverrides,
      },
    },
    hasMany,
    index: true,
    label: label ?? 'Tags',
    relationTo,
    ...restOptions,
  } as RelationshipField
}
