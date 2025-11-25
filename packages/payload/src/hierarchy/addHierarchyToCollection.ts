import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { hierarchyCollectionAfterChange } from './hooks/collectionAfterChange.js'
import { hierarchyCollectionAfterRead } from './hooks/collectionAfterRead.js'
import { defaultSlugify } from './utils/defaultSlugify.js'
import { findUseAsTitleField } from './utils/findUseAsTitle.js'

export const addHierarchyToCollection = ({
  collectionConfig,
  config,
  parentFieldName,
  prefixSlugPathFieldName = '_prefixSlugPath',
  prefixTitlePathFieldName = '_prefixTitlePath',
  slugify = defaultSlugify,
  virtual,
}: {
  collectionConfig: CollectionConfig
  config: Config
  parentFieldName: string
  prefixSlugPathFieldName?: string
  prefixTitlePathFieldName?: string
  slugify?: (text: string) => string
  /**
   * When true, the path fields will be computed dynamically on read instead of being stored in the database.
   * This reduces database writes and storage but requires computation on every read.
   * When false (default), paths are stored and updated via afterChange hooks.
   */
  virtual: boolean
}) => {
  const titleField = findUseAsTitleField(collectionConfig)
  const localizeField: boolean = Boolean(config.localization && titleField.localized)

  collectionConfig.fields.push(
    {
      name: prefixSlugPathFieldName,
      type: 'text',
      admin: {
        readOnly: true,
        // hidden: true,
      },
      // Only index and store in DB if not virtual
      index: !virtual,
      label: ({ t }) => t('general:prefixSlugPathFieldName'),
      localized: localizeField,
      // Mark as virtual if option is enabled
      virtual,
    },
    {
      name: prefixTitlePathFieldName,
      type: 'text',
      admin: {
        readOnly: true,
        // hidden: true,
      },
      // Only index and store in DB if not virtual
      index: !virtual,
      label: ({ t }) => t('general:prefixTitlePathFieldName'),
      localized: localizeField,
      // Mark as virtual if option is enabled
      virtual,
    },
    ...(virtual
      ? ([] as any[])
      : [
          {
            name: '_parentTree',
            type: 'relationship',
            admin: {
              allowEdit: false,
              hidden: true,
              isSortable: false,
              readOnly: true,
            },
            hasMany: true,
            index: true,
            maxDepth: 0,
            relationTo: collectionConfig.slug,
          },
        ]),
  )

  if (!collectionConfig.admin) {
    collectionConfig.admin = {}
  }
  if (!collectionConfig.admin.listSearchableFields) {
    collectionConfig.admin.listSearchableFields = [titleField.name!]
  } else if (!collectionConfig.admin.listSearchableFields.includes(titleField.name!)) {
    collectionConfig.admin.listSearchableFields.push(titleField.name!)
  }

  if (virtual) {
    // Use afterRead hook to compute paths dynamically
    collectionConfig.hooks = {
      ...(collectionConfig.hooks || {}),
      afterRead: [
        ...(collectionConfig.hooks?.afterRead || []),
        hierarchyCollectionAfterRead({
          parentDocFieldName: parentFieldName,
          slugify,
          slugPathFieldName: prefixSlugPathFieldName,
          titleField,
          titlePathFieldName: prefixTitlePathFieldName,
        }),
      ],
    }
  } else {
    // Use afterChange hook to store paths in database
    collectionConfig.hooks = {
      ...(collectionConfig.hooks || {}),
      afterChange: [
        ...(collectionConfig.hooks?.afterChange || []),
        hierarchyCollectionAfterChange({
          parentDocFieldName: parentFieldName,
          slugify,
          slugPathFieldName: prefixSlugPathFieldName,
          titleField,
          titlePathFieldName: prefixTitlePathFieldName,
        }),
      ],
    }
  }
}
