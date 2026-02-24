import type { CollectionConfig } from '../collections/config/types.js'
import type { HierarchyConfig } from './types.js'

import { getHierarchyFieldName } from './constants.js'

/**
 * Hierarchy options for tag collections - all fields optional since defaults are applied.
 */
type TagHierarchyOptions = {
  parentFieldName?: string
} & Partial<Omit<HierarchyConfig, 'parentFieldName'>>

/**
 * Options for creating a tag collection.
 * Same as CollectionConfig but with `useAsTitle` required.
 */
export type CreateTagsCollectionOptions = {
  /**
   * Hierarchy configuration (defaults applied for tag behavior)
   * `allowHasMany` defaults to true but can be overridden
   */
  hierarchy?: TagHierarchyOptions
  /**
   * Field name to use as the display title in the tag tree.
   * Required to ensure tags display meaningful names.
   */
  useAsTitle: string
} & Omit<CollectionConfig, 'admin' | 'hierarchy'> &
  Partial<Pick<CollectionConfig, 'admin'>>

/**
 * Creates a collection config for a tag-style hierarchy.
 *
 * This helper provides:
 * - `hierarchy.allowHasMany: true` by default (can be overridden)
 * - Default tag icon component
 * - Required `useAsTitle` to ensure tags display meaningful names
 *
 * @example
 * import { createTagsCollection, createTagField } from 'payload'
 *
 * const Tags = createTagsCollection({
 *   slug: 'tags',
 *   useAsTitle: 'name',
 *   fields: [
 *     { name: 'name', type: 'text', required: true },
 *   ],
 * })
 *
 * // Then in related collections:
 * const Posts: CollectionConfig = {
 *   slug: 'posts',
 *   fields: [
 *     createTagField({ relationTo: 'tags' }),
 *   ],
 * }
 */
export function createTagsCollection(options: CreateTagsCollectionOptions): CollectionConfig {
  const { admin: adminOverrides, hierarchy: hierarchyOverrides, useAsTitle, ...rest } = options

  return {
    labels: {
      plural: 'Tags',
      singular: 'Tag',
    },
    ...rest,
    admin: {
      group: false,
      ...adminOverrides,
      useAsTitle,
    },
    hierarchy: {
      allowHasMany: true,
      ...hierarchyOverrides,
      admin: {
        ...hierarchyOverrides?.admin,
        components: {
          Icon: '@payloadcms/ui#TagIcon',
          ...hierarchyOverrides?.admin?.components,
        },
      },
      parentFieldName: hierarchyOverrides?.parentFieldName ?? getHierarchyFieldName(rest.slug),
    },
  }
}
