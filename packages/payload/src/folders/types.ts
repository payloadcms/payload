import type { HierarchyConfig } from '../hierarchy/types.js'

/**
 * Sanitized related collection info with computed field name.
 */
export type SanitizedFolderRelatedCollection = {
  /** Name of the folder relationship field */
  fieldName: string
}

/**
 * Configuration for folder collection behavior.
 *
 * When a collection has a `folder` property, it is treated as a folder collection
 * that can organize documents from other collections.
 *
 * Inherits hierarchy options (parentFieldName, slugPathFieldName, titlePathFieldName, slugify)
 * which are passed through to the underlying hierarchy configuration.
 */
export type FolderConfig = {
  /**
   * If true, folders can be scoped to specific collections.
   * Adds a `folderType` select field to choose which collections
   * a folder can contain.
   *
   * When creating nested folders, the scope is inherited from the parent.
   * @default false
   */
  collectionSpecific?: boolean
  /**
   * Maximum number of children to load per parent node in the tree
   * @default 100
   */
  treeLimit?: number
} & Partial<HierarchyConfig>

/**
 * Sanitized folder configuration with all defaults applied.
 * Folder-specific settings only - shared hierarchy settings live on `taxonomy` config.
 */
export type SanitizedFolderConfig = {
  /**
   * If true, folders can be scoped to specific collections.
   */
  collectionSpecific: boolean
}

export type FolderBreadcrumb = {
  id: null | number | string
  name: string
}

type BaseFolderSortKeys = 'createdAt' | 'name' | 'updatedAt'

export type FolderSortKeys = `-${BaseFolderSortKeys}` | BaseFolderSortKeys
