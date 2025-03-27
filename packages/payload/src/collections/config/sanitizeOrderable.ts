import type { Field } from '../../fields/config/types.js'
import type { BeforeChangeHook, SanitizedCollectionConfig } from './types.js'

import { generateKeyBetween } from '../../utilities/fractional-indexing.js'
import { getReorderEndpoint } from '../endpoints/reorder.js'

export const ORDER_FIELD_NAME = '_order'

export const sanitizeOrderable = (collection: SanitizedCollectionConfig) => {
  if (!collection.orderable) {
    return
  }
  // 1. Add field
  const orderField: Field = {
    name: ORDER_FIELD_NAME,
    type: 'text',
    admin: {
      disableBulkEdit: true,
      disabled: true,
      disableListColumn: true,
      disableListFilter: true,
      hidden: true,
      readOnly: true,
    },
    index: true,
    label: ({ t }) => t('general:order'),
    required: true,
    unique: true,
  }

  collection.fields.unshift(orderField)

  // 2. Add hook
  const orderBeforeChangeHook: BeforeChangeHook = async ({ data, operation, req }) => {
    // Only set _order on create, not on update (unless explicitly provided)
    if (operation === 'create') {
      // Find the last document to place this one after
      const lastDoc = await req.payload.find({
        collection: collection.slug,
        depth: 0,
        limit: 1,
        pagination: false,
        select: { [ORDER_FIELD_NAME]: true },
        sort: `-${ORDER_FIELD_NAME}`,
      })

      const lastOrderValue: null | string = (lastDoc.docs[0]?.[ORDER_FIELD_NAME] as string) || null
      data[ORDER_FIELD_NAME] = generateKeyBetween(lastOrderValue, null)
    }

    return data
  }

  collection.hooks.beforeChange.push(orderBeforeChangeHook)

  // 3. Add endpoint
  if (collection.endpoints !== false) {
    collection.endpoints.push(getReorderEndpoint(collection))
  }
}
