import type { AddTreeViewFieldsArgs } from './types.js'

import { collectionTreeViewAfterChange } from './hooks/collectionAfterChange.js'
import { defaultSlugify } from './utils/defaultSlugify.js'
import { findUseAsTitleField } from './utils/findUseAsTitleField.js'

export function addTreeViewFields({
  collectionConfig,
  parentDocFieldName = '_parentDoc',
  slugify = defaultSlugify,
  slugPathFieldName = 'slugPath',
  titlePathFieldName = 'titlePath',
}: AddTreeViewFieldsArgs): void {
  const titleField = findUseAsTitleField(collectionConfig)

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
        // TODO: these should only be localized if the title field is also localized
        localized: true,
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
        // TODO: these should only be localized if the title field is also localized
        localized: true,
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
