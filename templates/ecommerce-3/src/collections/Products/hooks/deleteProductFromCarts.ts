import type { CollectionAfterDeleteHook } from 'payload'

import type { Product } from '@/payload-types'

export const deleteProductFromCarts: CollectionAfterDeleteHook<Product> = async ({ id, req }) => {
  const usersWithProductInCart = await req.payload.find({
    collection: 'users',
    overrideAccess: true,
    where: {
      'cart.items.product': {
        equals: id,
      },
    },
  })

  if (usersWithProductInCart.totalDocs > 0) {
    await Promise.all(
      usersWithProductInCart.docs.map(async (user) => {
        const cart = user.cart

        if (cart?.items?.length) {
          const itemsWithoutProduct = cart.items.filter((item) => item.product !== id)
          const cartWithoutProduct = {
            ...cart,
            items: itemsWithoutProduct,
          }

          return req.payload.update({
            id: user.id,
            collection: 'users',
            data: {
              cart: cartWithoutProduct,
            },
          })
        }
      }),
    )
  }
}
