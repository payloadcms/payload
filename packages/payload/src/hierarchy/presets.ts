import type { FoldersConfig, TagsConfig } from '../collections/config/types.js'
import type { HierarchyConfig } from './types.js'

import { getHierarchyFieldName } from './constants.js'

/**
 * Builds hierarchy config from folders preset.
 * Applies folder defaults: allowHasMany: false, FolderIcon, useHeaderButton: true
 */
export function buildFoldersHierarchy(config: FoldersConfig | true, slug: string): HierarchyConfig {
  const options = config === true ? {} : config

  const parentFieldName = options.parentFieldName ?? getHierarchyFieldName(slug)

  return {
    ...options,
    admin: {
      ...options.admin,
      components: {
        Icon: {
          clientProps: { color: 'muted' },
          path: '@payloadcms/ui#FolderIcon',
        },
        ...options.admin?.components,
      },
      useHeaderButton: options.admin?.useHeaderButton ?? true,
    },
    allowHasMany: false, // Enforced for folders
    parentFieldName,
  }
}

/**
 * Builds hierarchy config from tags preset.
 * Applies tag defaults: allowHasMany: true, TagIcon
 */
export function buildTagsHierarchy(config: TagsConfig | true, slug: string): HierarchyConfig {
  const options = config === true ? {} : config

  const parentFieldName = options.parentFieldName ?? getHierarchyFieldName(slug)

  return {
    ...options,
    admin: {
      ...options.admin,
      components: {
        Icon: {
          clientProps: { color: 'muted' },
          path: '@payloadcms/ui#TagIcon',
        },
        ...options.admin?.components,
      },
    },
    allowHasMany: options.allowHasMany ?? true, // Default true, can override
    parentFieldName,
  }
}
