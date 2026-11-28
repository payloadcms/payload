import type { CollectionConfig } from 'payload'

import { orderableJoinSlug } from '../OrderableJoin/index.js'

export const orderableSlug = 'orderable'

export const readRequestHeader = 'x-orderable-read-test'

/**
 * While `isTracking`, the value of `readRequestHeader` on each read operation's request,
 * or `null` when the operation did not receive the incoming request.
 */
export const orderableReadRequests: { isTracking: boolean; values: (null | string)[] } = {
  isTracking: false,
  values: [],
}

export const OrderableCollection: CollectionConfig = {
  slug: orderableSlug,
  access: {
    update: () => ({
      title: {
        not_equals: 'Fixed position',
      },
    }),
  },
  admin: {
    components: {
      beforeList: ['/Seed.tsx#Seed'],
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'orderableField',
      type: 'relationship',
      localized: true,
      relationTo: orderableJoinSlug,
    },
  ],
  hooks: {
    beforeOperation: [
      ({ args, operation, req }) => {
        if (orderableReadRequests.isTracking && operation === 'read') {
          orderableReadRequests.values.push(req.headers?.get(readRequestHeader) ?? null)
        }

        return args
      },
    ],
  },
  orderable: true,
  versions: false,
}
