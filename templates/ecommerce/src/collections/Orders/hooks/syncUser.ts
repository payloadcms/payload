import type { AfterChangeHook } from 'payload/dist/collections/config/types'

import type { Order, User } from '../../../payload-types'

// sync user purchases and delete their cart when they place an order

export const syncUser: AfterChangeHook<Order> = async ({
  req,
  doc,
  // operation
}) => {
  const { payload } = req
  const { orderedBy, items } = doc
  const { user } = orderedBy

  const orderedByID = typeof user === 'object' ? user.id : user

  if (!orderedByID) {
    payload.logger.error('Error in `syncUser` hook: No user ID found on order')
  }

  const fullUser: User = await req.payload.findByID({
    collection: 'users',
    id: orderedByID,
  })

  if (fullUser && typeof fullUser === 'object') {
    const { purchases } = fullUser

    const allIDs = [
      ...(purchases?.map(purchase => (typeof purchase === 'object' ? purchase.id : purchase)) ||
        []),
      ...(items?.map(({ product }) => (typeof product === 'object' ? product.id : product)) || []),
    ]

    const purchasedProductIDs = allIDs.filter((id, index) => allIDs.indexOf(id) === index)

    await req.payload.update({
      collection: 'users',
      id: fullUser.id,
      data: {
        // let Payload API resolve any duplicate IDs
        purchases: purchasedProductIDs,
        // clear their cart
        cart: {
          items: [],
        },
      },
    })
  }
}
