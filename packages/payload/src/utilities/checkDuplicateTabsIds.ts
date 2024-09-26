import type { SanitizedCollectionConfig } from '../collections/config/types.js'

import { DuplicateTabsIds } from '../errors/DuplicateTabsIds.js'
import { traverseFields } from './traverseFields.js'

const getDuplicates = (arr: string[]) => arr.filter((item, index) => arr.indexOf(item) !== index)

const checkDuplicateTabsIds = (collections: SanitizedCollectionConfig[]): void => {
  collections.forEach((collection) => {
    const fields = collection.fields
    const tabIds: string[] = []

    traverseFields({
      callback: ({ field }) => {
        if (field.type === 'tabs' && field.id) {
          tabIds.push(field.id)
        }
      },
      fields,
    })

    const duplicateTabIds = getDuplicates(tabIds)

    if (duplicateTabIds.length > 0) {
      throw new DuplicateTabsIds(duplicateTabIds)
    }
  })
}

export default checkDuplicateTabsIds
