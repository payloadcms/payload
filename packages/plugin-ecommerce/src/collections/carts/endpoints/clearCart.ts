import type { CollectionSlug, Endpoint } from 'payload'

import { addDataAndFileToRequest } from 'payload'

import { clearCart } from '../operations/clearCart.js'

type Args = {
  cartsSlug: CollectionSlug
}

/**
 * Creates an endpoint handler for clearing all items from a cart.
 *
 * Route: POST /api/{cartsSlug}/:id/clear
 *
 * Request body:
 * - secret?: string (for guest cart access)
 */
export const clearCartEndpoint = ({ cartsSlug }: Args): Endpoint => ({
  handler: async (req) => {
    await addDataAndFileToRequest(req)

    const cartID = req.routeParams?.id as string | undefined
    const data = req.data as {
      secret?: string
    }

    if (!cartID) {
      return Response.json({ message: 'Cart ID is required', success: false }, { status: 400 })
    }

    const result = await clearCart({
      cartID,
      cartsSlug,
      payload: req.payload,
      req,
      secret: data?.secret,
    })

    if (!result.success) {
      return Response.json(result, { status: 404 })
    }

    return Response.json(result)
  },
  method: 'post',
  path: '/:id/clear',
})
