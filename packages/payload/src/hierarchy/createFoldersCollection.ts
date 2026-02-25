import type { CollectionConfig } from '../collections/config/types.js'
import type { HierarchyConfig } from './types.js'

import { getHierarchyFieldName } from './constants.js'

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
export type CreateFoldersCollectionOptions = {
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
 * import { createFoldersCollection, createFolderField } from 'payload'
 *
 * const Folders = createFoldersCollection({
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
export function createFoldersCollection(options: CreateFoldersCollectionOptions): CollectionConfig {
  const { admin: adminOverrides, hierarchy: hierarchyOverrides, useAsTitle, ...rest } = options
  const slug = rest.slug

  // Default parent field to match the hierarchy field name pattern
  // This enables the joinField to work with both subfolders and related documents
  const parentFieldName = hierarchyOverrides?.parentFieldName ?? getHierarchyFieldName(slug)

  return {
    labels: {
      plural: 'Folders',
      singular: 'Folder',
    },
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
          Icon: '@payloadcms/ui#FolderIcon',
          ...hierarchyOverrides?.admin?.components,
        },
        useHeaderButton: hierarchyOverrides?.admin?.useHeaderButton ?? true,
      },
      allowHasMany: false,
      parentFieldName,
    },
  }
}
