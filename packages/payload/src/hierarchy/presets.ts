import type { CollectionConfig, FoldersConfig, TagsConfig } from '../collections/config/types.js'
import type { HierarchyConfig, NestedDocsConfig } from './types.js'

import { fieldAffectsData } from '../fields/config/types.js'
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
    pathStrategy: options.pathStrategy ?? 'virtual',
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
    pathStrategy: options.pathStrategy ?? 'virtual',
  }
}

/**
 * Builds hierarchy config from nested docs preset.
 * Applies page-tree defaults: parent field, stored paths, hidden sidebar tab, header parent picker.
 */
export function buildNestedDocsHierarchy(
  config: NestedDocsConfig | true,
  collection: CollectionConfig,
): HierarchyConfig {
  const options = config === true ? {} : config
  const hasSlugField = collection.fields.some(
    (field) => fieldAffectsData(field) && field.name === 'slug',
  )
  const hasTitleField = collection.fields.some(
    (field) => fieldAffectsData(field) && field.name === 'title',
  )
  const slugFieldName = options.slugField ?? (hasSlugField ? 'slug' : undefined)

  if (slugFieldName) {
    const slugField = collection.fields.find(
      (field) => fieldAffectsData(field) && field.name === slugFieldName,
    )

    if (slugField && slugField.admin?.position === undefined) {
      slugField.admin = {
        ...slugField.admin,
        position: 'sidebar',
      }
    }
  }

  return {
    ...options,
    admin: {
      ...options.admin,
      injectSidebarTab: options.admin?.injectSidebarTab ?? false,
      useHeaderButton: options.admin?.useHeaderButton ?? true,
    },
    parentFieldName: options.parentFieldName ?? 'parent',
    pathStrategy: options.pathStrategy ?? 'stored',
    slugField: slugFieldName,
    titleField: options.titleField ?? (hasTitleField ? 'title' : 'id'),
  }
}
