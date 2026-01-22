import type { CollectionConfig } from '../collections/config/types.js'
import type { Config } from '../config/types.js'

import { hierarchyCollectionAfterChange } from './hooks/collectionAfterChange.js'
import { hierarchyCollectionBeforeChange } from './hooks/collectionBeforeChange.js'
import { defaultSlugify } from './utils/defaultSlugify.js'
import { findUseAsTitleField } from './utils/findUseAsTitle.js'

export const addHierarchyToCollection = ({
  collectionConfig,
  config,
  generatePaths = true,
  parentFieldName,
  slugify = defaultSlugify,
  slugPathFieldName = '_h_slugPath',
  titlePathFieldName = '_h_titlePath',
}: {
  collectionConfig: CollectionConfig
  config: Config
  generatePaths?: boolean
  parentFieldName: string
  slugify?: (text: string) => string
  slugPathFieldName?: string
  titlePathFieldName?: string
}) => {
  const { localized, titleFieldName } = findUseAsTitleField(collectionConfig)
  const localizeField: boolean = Boolean(config.localization && localized)

  // Conditionally add path fields
  if (generatePaths) {
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
    )
  }

  // Always add parentTree and depth fields
  collectionConfig.fields.push(
    {
      name: '_h_parentTree',
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
    {
      name: '_h_depth',
      type: 'number',
      admin: {
        hidden: true,
        readOnly: true,
      },
      index: true,
    },
  )

  if (!collectionConfig.admin) {
    collectionConfig.admin = {}
  }
  if (!collectionConfig.admin.listSearchableFields) {
    collectionConfig.admin.listSearchableFields = [titleFieldName]
  } else if (!collectionConfig.admin.listSearchableFields.includes(titleFieldName)) {
    collectionConfig.admin.listSearchableFields.push(titleFieldName)
  }

  collectionConfig.hooks = {
    ...(collectionConfig.hooks || {}),
    afterChange: [
      ...(collectionConfig.hooks?.afterChange || []),
      hierarchyCollectionAfterChange({
        generatePaths,
        isTitleLocalized: localized,
        parentFieldName,
        slugify,
        slugPathFieldName,
        titleFieldName,
        titlePathFieldName,
      }),
    ],
    beforeChange: [
      ...(collectionConfig.hooks?.beforeChange || []),
      hierarchyCollectionBeforeChange({
        generatePaths,
        isTitleLocalized: localized,
        parentFieldName,
        slugify,
        slugPathFieldName,
        titleFieldName,
        titlePathFieldName,
      }),
    ],
  }
}
