import type { CollectionConfig } from '../collections/config/types.js'
import type { Field, Option, RelationshipField, SelectField } from '../fields/config/types.js'

import { defaultAccess } from '../auth/defaultAccess.js'
import { buildFolderField } from './buildFolderField.js'
import { deleteSubfoldersBeforeDelete } from './hooks/deleteSubfoldersAfterDelete.js'
import { dissasociateAfterDelete } from './hooks/dissasociateAfterDelete.js'
import { ensureSafeCollectionsChange } from './hooks/ensureSafeCollectionsChange.js'
import { reparentChildFolder } from './hooks/reparentChildFolder.js'

/**
 * Configuration for folder collection behavior
 */
export type FolderConfig = {
  /**
   * Name of the field that references the parent folder
   * @default 'parent'
   */
  parentFieldName?: string
  /**
   * Collections that can be organized into folders
   * These collections will have folder fields added to them
   */
  relatedCollections?: string[]
}

/**
 * Sanitized folder configuration with defaults applied
 */
export type SanitizedFolderConfig = {
  parentFieldName: string
  relatedCollections: string[]
}

/**
 * Options for creating a folder collection.
 * Same as CollectionConfig but with `folder` required.
 */
export type CreateFolderCollectionOptions = {
  /**
   * Folder configuration (required)
   */
  folder: FolderConfig
} & Omit<CollectionConfig, 'folder'>

/**
 * Internal arguments for creating a folder collection.
 * Used by the automatic folder system during config sanitization.
 * @internal
 */
type CreateInternalFolderCollectionArgs = {
  collectionSpecific: boolean
  debug?: boolean
  folderEnabledCollections: CollectionConfig[]
  folderFieldName: string
  slug: string
}

/**
 * Creates a collection config for a folder collection.
 *
 * This helper provides:
 * - Required `name` field for folder display
 * - Parent relationship field for hierarchical structure
 * - Hooks for folder management (reparenting, cascade delete)
 * - `admin.group: false` by default to hide from collections list
 * - `useAsTitle: 'name'` for admin display
 *
 * @example
 * import { createFolderCollection } from 'payload'
 *
 * const Folders = createFolderCollection({
 *   slug: 'folders',
 *   folder: {
 *     relatedCollections: ['posts', 'pages', 'media'],
 *   },
 *   fields: [
 *     // Additional fields beyond the required name and parent
 *     { name: 'description', type: 'textarea' },
 *   ],
 * })
 */
export function createFolderCollection(options: CreateFolderCollectionOptions): CollectionConfig {
  const {
    slug,
    admin: adminOverrides,
    fields: additionalFields = [],
    folder,
    hooks: hooksOverrides,
    ...rest
  } = options

  const parentFieldName = folder.parentFieldName || 'parent'

  const parentField: RelationshipField = {
    name: parentFieldName,
    type: 'relationship',
    admin: {
      hidden: true,
    },
    hasMany: false,
    index: true,
    label: 'Parent Folder',
    relationTo: slug,
  }

  return {
    slug,
    ...rest,
    admin: {
      group: false,
      useAsTitle: 'name',
      ...(adminOverrides || {}),
    },
    fields: [
      {
        name: 'name',
        type: 'text',
        index: true,
        required: true,
      },
      parentField,
      ...additionalFields,
    ],
    folder,
    hooks: {
      ...hooksOverrides,
      afterChange: [
        reparentChildFolder({ folderFieldName: parentFieldName }),
        ...(hooksOverrides?.afterChange || []),
      ],
      beforeDelete: [
        deleteSubfoldersBeforeDelete({ folderFieldName: parentFieldName, folderSlug: slug }),
        ...(hooksOverrides?.beforeDelete || []),
      ],
    },
    labels: {
      plural: 'Folders',
      singular: 'Folder',
      ...rest.labels,
    },
    typescript: {
      interface: 'FolderInterface',
      ...rest.typescript,
    },
  } as CollectionConfig
}

/**
 * Creates a folder collection for the automatic folder system.
 * Used internally during config sanitization.
 * @internal
 */
export function createInternalFolderCollection({
  slug,
  collectionSpecific,
  debug,
  folderEnabledCollections,
  folderFieldName,
}: CreateInternalFolderCollectionArgs): CollectionConfig {
  const { collectionOptions, collectionSlugs } = folderEnabledCollections.reduce(
    (acc, collection: CollectionConfig) => {
      acc.collectionSlugs.push(collection.slug)
      acc.collectionOptions.push({
        label: collection.labels?.plural || collection.slug,
        value: collection.slug,
      })

      return acc
    },
    {
      collectionOptions: [] as Option[],
      collectionSlugs: [] as string[],
    },
  )

  return {
    slug,
    access: {
      create: defaultAccess,
      delete: defaultAccess,
      read: defaultAccess,
      readVersions: defaultAccess,
      update: defaultAccess,
    },
    admin: {
      hidden: !debug,
      useAsTitle: 'name',
    },
    fields: [
      {
        name: 'name',
        type: 'text',
        index: true,
        required: true,
      },
      buildFolderField({
        collectionSpecific,
        folderFieldName,
        folderSlug: slug,
        overrides: {
          admin: {
            hidden: !debug,
          },
        },
      }),
      {
        name: 'documentsAndFolders',
        type: 'join',
        admin: {
          hidden: !debug,
        },
        collection: [slug, ...collectionSlugs],
        hasMany: true,
        on: folderFieldName,
      },
      ...(collectionSpecific
        ? [
            {
              name: 'folderType',
              type: 'select',
              admin: {
                components: {
                  Field: {
                    path: '@payloadcms/next/client#FolderTypeField',
                  },
                },
                position: 'sidebar',
              },
              hasMany: true,
              options: collectionOptions,
            } satisfies SelectField,
          ]
        : ([] as Field[])),
    ],
    hooks: {
      afterChange: [
        reparentChildFolder({
          folderFieldName,
        }),
      ],
      afterDelete: [
        dissasociateAfterDelete({
          collectionSlugs,
          folderFieldName,
        }),
      ],
      beforeDelete: [deleteSubfoldersBeforeDelete({ folderFieldName, folderSlug: slug })],
      beforeValidate: [
        ...(collectionSpecific ? [ensureSafeCollectionsChange({ foldersSlug: slug })] : []),
      ],
    },
    labels: {
      plural: 'Folders',
      singular: 'Folder',
    },
    typescript: {
      interface: 'FolderInterface',
    },
  }
}
