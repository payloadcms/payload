import type { CollectionConfig } from '../collections/config/types.js'

import { collectionBeforeChange } from './hooks/collectionBeforeChange.js'
import { collectionBeforeDelete } from './hooks/collectionBeforeDelete.js'
import { collectionAfterChangeStored } from './hooks/stored/collectionAfterChange.js'
import { collectionAfterReadVirtual } from './hooks/virtual/collectionAfterRead.js'
import { collectionBeforeOperationVirtual } from './hooks/virtual/collectionBeforeOperation.js'

export const addHierarchyToCollection = ({
  collectionConfig,
  isPathLocalized,
  parentFieldName,
  pathStrategy,
  slugFieldName,
  slugPathFieldName,
  titleFieldName,
  titlePathFieldName,
}: {
  collectionConfig: CollectionConfig
  isPathLocalized: boolean
  parentFieldName: string
  pathStrategy: 'stored' | 'virtual'
  slugFieldName?: string
  slugPathFieldName: string
  titleFieldName: string
  titlePathFieldName: string
}) => {
  // Add path fields. Virtual strategy computes these on read, stored strategy persists them.
  collectionConfig.fields.push(
    {
      name: slugPathFieldName,
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        // hidden: true,
      },
      index: true,
      label: 'Slug Path',
      localized: isPathLocalized || undefined,
      virtual: pathStrategy === 'virtual',
    },
    {
      name: titlePathFieldName,
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
        // hidden: true,
      },
      index: true,
      label: 'Title Path',
      localized: isPathLocalized || undefined,
      virtual: pathStrategy === 'virtual',
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
    afterChange:
      pathStrategy === 'stored'
        ? [
            ...(collectionConfig.hooks?.afterChange || []),
            collectionAfterChangeStored({
              isPathLocalized,
              parentFieldName,
              slugPathFieldName,
              titlePathFieldName,
            }),
          ]
        : collectionConfig.hooks?.afterChange || [],
    afterRead:
      pathStrategy === 'virtual'
        ? [
            ...(collectionConfig.hooks?.afterRead || []),
            collectionAfterReadVirtual({
              isPathLocalized,
              parentFieldName,
              slugPathFieldName,
              titlePathFieldName,
            }),
          ]
        : collectionConfig.hooks?.afterRead || [],
    beforeChange: [
      ...(collectionConfig.hooks?.beforeChange || []),
      collectionBeforeChange({
        parentFieldName,
        pathStrategy,
        slugPathFieldName,
        titleFieldName,
        titlePathFieldName,
      }),
    ],
    beforeDelete: [
      ...(collectionConfig.hooks?.beforeDelete || []),
      collectionBeforeDelete({ parentFieldName }),
    ],
    beforeOperation:
      pathStrategy === 'virtual'
        ? [
            ...(collectionConfig.hooks?.beforeOperation || []),
            collectionBeforeOperationVirtual({
              parentFieldName,
              slugFieldName,
              slugPathFieldName,
              titleFieldName,
              titlePathFieldName,
            }),
          ]
        : collectionConfig.hooks?.beforeOperation || [],
  }
}
