import type { CollectionConfig } from '../collections/config/types.js'

import { hierarchyCollectionAfterRead } from './hooks/collectionAfterRead.js'
import { hierarchyCollectionBeforeChange } from './hooks/collectionBeforeChange.js'
import { hierarchyCollectionBeforeDelete } from './hooks/collectionBeforeDelete.js'
import { findUseAsTitleField } from './utils/findUseAsTitle.js'

export const addHierarchyToCollection = ({
  collectionConfig,
  parentFieldName,
  slugPathFieldName,
  titlePathFieldName,
}: {
  collectionConfig: CollectionConfig
  parentFieldName: string
  slugPathFieldName: string
  titlePathFieldName: string
}) => {
  const { titleFieldName } = findUseAsTitleField(collectionConfig)

  // Add virtual path fields (computed in afterRead)
  collectionConfig.fields.push(
    {
      name: slugPathFieldName,
      type: 'text',
      admin: {
        readOnly: true,
        // hidden: true,
      },
      index: true,
      label: 'Slug Path',
      virtual: true,
    },
    {
      name: titlePathFieldName,
      type: 'text',
      admin: {
        readOnly: true,
        // hidden: true,
      },
      index: true,
      label: 'Title Path',
      virtual: true,
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
    afterRead: [
      ...(collectionConfig.hooks?.afterRead || []),
      hierarchyCollectionAfterRead({ parentFieldName, slugPathFieldName, titlePathFieldName }),
    ],
    beforeChange: [
      ...(collectionConfig.hooks?.beforeChange || []),
      hierarchyCollectionBeforeChange({ parentFieldName }),
    ],
    beforeDelete: [
      ...(collectionConfig.hooks?.beforeDelete || []),
      hierarchyCollectionBeforeDelete({ parentFieldName }),
    ],
  }
}
