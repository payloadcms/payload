import type { CollectionConfig } from 'payload'

import { APIError } from 'payload'

export const orderableHookErrorSlug = 'orderable-hook-error'

export const orderableHookErrorMessage = 'Reordering is blocked by a beforeChange hook'

export const OrderableHookErrorCollection: CollectionConfig = {
  slug: orderableHookErrorSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'update' && data?._order !== undefined) {
          throw new APIError(orderableHookErrorMessage, 400)
        }

        return data
      },
    ],
  },
  orderable: true,
}
