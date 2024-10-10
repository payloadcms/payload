import type { CollectionAfterChangeHook } from 'payload'

import type { Order } from '@/payload-types'

/**
 * Creates a new order in the user's orders array
 */
export const updateUserOrders: CollectionAfterChangeHook<Order> = async ({
  doc,
  operation,
  req,
}) => {
  const { payload } = req

  if ((operation === 'create' || operation === 'update') && doc.orderedBy && doc.items) {
    const orderedBy = typeof doc.orderedBy === 'object' ? doc.orderedBy.id : doc.orderedBy

    const user = await payload.findByID({
      id: orderedBy,
      collection: 'users',
      req,
    })

    if (user) {
      await payload.update({
        id: orderedBy,
        collection: 'users',
        data: {
          orders: [
            ...(user?.orders?.map((order) => (typeof order === 'object' ? order.id : order)) || []), // eslint-disable-line function-paren-newline
            doc.id,
          ],
        },
        req,
      })
    }
  }

  return
}
