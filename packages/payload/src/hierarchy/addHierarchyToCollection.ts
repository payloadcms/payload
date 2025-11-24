import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { hierarchyCollectionAfterChange } from './hooks/collectionAfterChange.js'
import { defaultSlugify } from './utils/defaultSlugify.js'
import { findUseAsTitleField } from './utils/findUseAsTitle.js'

export const addHierarchyToCollection = ({
  collectionConfig,
  config,
  parentFieldName,
  prefixSlugPathFieldName = '_prefixSlugPath',
  prefixTitlePathFieldName = '_prefixTitlePath',
  slugify = defaultSlugify,
}: {
  collectionConfig: CollectionConfig
  config: Config
  parentFieldName: string
  prefixSlugPathFieldName?: string
  prefixTitlePathFieldName?: string
  slugify?: (text: string) => string
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
      index: true,
      label: ({ t }) => t('general:prefixSlugPathFieldName'),
      localized: localizeField,
    },
    {
      name: prefixTitlePathFieldName,
      type: 'text',
      admin: {
        readOnly: true,
        // hidden: true,
      },
      index: true,
      label: ({ t }) => t('general:prefixTitlePathFieldName'),
      localized: localizeField,
    },
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
  )

  if (!collectionConfig.admin) {
    collectionConfig.admin = {}
  }
  if (!collectionConfig.admin.listSearchableFields) {
    collectionConfig.admin.listSearchableFields = [titleField.name]
  } else if (!collectionConfig.admin.listSearchableFields.includes(titleField.name)) {
    collectionConfig.admin.listSearchableFields.push(titleField.name)
  }

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
