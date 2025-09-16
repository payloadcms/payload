import type { AddTreeViewFieldsArgs } from './types.js'

import { collectionTreeViewAfterChange } from './hooks/collectionAfterChange.js'
import { defaultSlugify } from './utils/defaultSlugify.js'
import { findUseAsTitleField } from './utils/findUseAsTitleField.js'

export function addTreeViewFields({
  collectionConfig,
  config,
  parentDocFieldName = '_parentDoc',
  slugify = defaultSlugify,
  slugPathFieldName = 'slugPath',
  titlePathFieldName = 'titlePath',
}: AddTreeViewFieldsArgs): void {
  const titleField = findUseAsTitleField(collectionConfig)
  const localizeField: boolean = Boolean(config.localization && titleField.localized)

  collectionConfig.fields.push({
    type: 'group',
    admin: {
      position: 'sidebar',
    },
    fields: [
      {
        name: parentDocFieldName,
        type: 'relationship',
        admin: {
          disableBulkEdit: true,
        },
        filterOptions: ({ id }) => {
          return {
            id: {
              not_in: [id],
            },
          }
        },
        index: true,
        label: 'Parent Document',
        maxDepth: 0,
        relationTo: collectionConfig.slug,
      },
      {
        name: slugPathFieldName,
        type: 'text',
        admin: {
          readOnly: true,
          // hidden: true,
        },
        index: true,
        label: ({ t }) => t('general:slugPath'),
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
        label: ({ t }) => t('general:titlePath'),
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
    ],
    label: 'Document Tree',
  })

  if (!collectionConfig.admin) {
    collectionConfig.admin = {}
  }
  if (!collectionConfig.admin.listSearchableFields) {
    collectionConfig.admin.listSearchableFields = []
  }
  collectionConfig.admin.listSearchableFields.push(titlePathFieldName)

  collectionConfig.hooks = {
    ...(collectionConfig.hooks || {}),
    afterChange: [
      collectionTreeViewAfterChange({
        parentDocFieldName,
        slugify,
        slugPathFieldName,
        titleField,
        titlePathFieldName,
      }),
      // purposefully run other hooks _after_ the document tree is updated
      ...(collectionConfig.hooks?.afterChange || []),
    ],
  }
}
