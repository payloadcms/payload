import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { hierarchyCollectionAfterChange } from './hooks/collectionAfterChange.js'
import { defaultSlugify } from './utils/defaultSlugify.js'
import { findUseAsTitleField } from './utils/findUseAsTitle.js'

export const addHierarchyToCollection = ({
  collectionConfig,
  config,
  parentFieldName,
  slugify = defaultSlugify,
  slugPathFieldName = '_prefixSlugPath',
  titlePathFieldName = '_prefixTitlePath',
}: {
  collectionConfig: CollectionConfig
  config: Config
  parentFieldName: string
  slugify?: (text: string) => string
  slugPathFieldName?: string
  titlePathFieldName?: string
}) => {
  const titleField = findUseAsTitleField(collectionConfig)
  const localizeField: boolean = Boolean(config.localization && titleField.localized)

  collectionConfig.fields.push(
    {
      name: slugPathFieldName,
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
      name: titlePathFieldName,
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
    collectionConfig.admin.listSearchableFields = [titleField.name!]
  } else if (!collectionConfig.admin.listSearchableFields.includes(titleField.name)) {
    collectionConfig.admin.listSearchableFields.push(titleField.name)
  }

  collectionConfig.hooks = {
    ...(collectionConfig.hooks || {}),
    afterChange: [
      ...(collectionConfig.hooks?.afterChange || []),
      hierarchyCollectionAfterChange({
        isTitleLocalized: Boolean(titleField.localized),
        parentFieldName,
        slugify,
        slugPathFieldName,
        titleFieldName: titleField.name!,
        titlePathFieldName,
      }),
    ],
  }
}
