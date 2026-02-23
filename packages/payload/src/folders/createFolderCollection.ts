import type { CollectionConfig } from '../collections/config/types.js'
import type { FolderConfig } from './types.js'

/**
 * Options for creating a folder collection.
 * Same as CollectionConfig but with `folder` and `useAsTitle` required.
 */
export type CreateFolderCollectionOptions = {
  /**
   * Folder configuration (required)
   */
  folder: FolderConfig
  /**
   * Field name to use as the display title in the folder tree.
   * Required to ensure folders display meaningful names.
   */
  useAsTitle: string
} & Omit<CollectionConfig, 'admin' | 'folder'> &
  Partial<Pick<CollectionConfig, 'admin'>>

/**
 * Creates a collection config for a folder collection.
 *
 * This helper provides:
 * - Required `folder` property with proper typing
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
 *   folder: {},
 *   fields: [
 *     { name: 'name', type: 'text', required: true },
 *   ],
 * })
 *
 * // Then in related collections:
 * const Posts: CollectionConfig = {
 *   slug: 'posts',
 *   fields: [
 *     createFolderField({ folderSlug: 'folders' }),
 *   ],
 * }
 */
export function createFolderCollection(options: CreateFolderCollectionOptions): CollectionConfig {
  const { admin: adminOverrides, useAsTitle, ...rest } = options

  return {
    ...rest,
    admin: {
      group: false,
      ...adminOverrides,
      useAsTitle,
    },
  }
}
