import type { CollectionConfig } from '../collections/config/types.js'
import type { HierarchyConfig } from './types.js'

import { HIERARCHY_PARENT_FIELD } from './constants.js'

/**
 * Hierarchy options for folder collections - all fields optional since defaults are applied.
 * Cannot override `allowHasMany` - folders always use single-select.
 */
type FolderHierarchyOptions = {
  parentFieldName?: string
} & Partial<Omit<HierarchyConfig, 'allowHasMany' | 'parentFieldName'>>

/**
 * Options for creating a folder collection.
 * Same as CollectionConfig but with `useAsTitle` required.
 */
export type CreateFolderCollectionOptions = {
  /**
   * Hierarchy configuration (defaults applied for folder behavior)
   * Cannot override `allowHasMany` - folders always use single-select
   */
  hierarchy?: FolderHierarchyOptions
  /**
   * Field name to use as the display title in the folder tree.
   * Required to ensure folders display meaningful names.
   */
  useAsTitle: string
} & Omit<CollectionConfig, 'admin' | 'hierarchy'> &
  Partial<Pick<CollectionConfig, 'admin'>>

/**
 * Creates a collection config for a folder-style hierarchy.
 *
 * This helper provides:
 * - `hierarchy.allowHasMany: false` (enforced, folders are single-select)
 * - Default folder icon component
 * - Required `useAsTitle` to ensure folders display meaningful names
 * - `admin.group: false` by default to hide from collections list
 *   (folder collections are accessed via their dedicated sidebar tab)
 *
 * @example
 * import { createFolderCollection, createFolderField } from 'payload'
 *
 * const Folders = createFolderCollection({
 *   slug: 'folders',
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
 *     createFolderField({ relationTo: 'folders' }),
 *   ],
 * }
 */
export function createFolderCollection(options: CreateFolderCollectionOptions): CollectionConfig {
  const { admin: adminOverrides, hierarchy: hierarchyOverrides, useAsTitle, ...rest } = options

  return {
    ...rest,
    admin: {
      group: false,
      ...adminOverrides,
      useAsTitle,
    },
    hierarchy: {
      ...hierarchyOverrides,
      admin: {
        ...hierarchyOverrides?.admin,
        components: {
          Icon: '@payloadcms/ui/elements/FolderIcon',
          ...hierarchyOverrides?.admin?.components,
        },
      },
      allowHasMany: false,
      parentFieldName: hierarchyOverrides?.parentFieldName ?? HIERARCHY_PARENT_FIELD,
    },
  }
}
