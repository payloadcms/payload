/**
 * Default field names and constants for folder feature
 */

export const FOLDER_PARENT_FIELD = 'parent'

/**
 * Generate the field name for a folder relationship field
 * @param folderSlug - The slug of the folder collection
 * @returns Field name like '_f_folders' or '_f_media-folders'
 */
export const getFolderFieldName = (folderSlug: string): string => {
  return `_f_${folderSlug}`
}

/**
 * Default limit for folder tree queries
 * This controls how many children are loaded per parent node
 */
export const DEFAULT_FOLDER_TREE_LIMIT = 100

// Legacy constants for auto-generated folder system
export const foldersSlug = 'payload-folders'
export const parentFolderFieldName = 'folder'
