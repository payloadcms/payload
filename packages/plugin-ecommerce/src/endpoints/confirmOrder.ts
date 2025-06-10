import { addDataAndFileToRequest, type Endpoint } from 'payload'

import type { Cart, PaymentAdapter } from '../types.js'

type Args = {
  /**
   * The slug of the orders collection, defaults to 'orders'.
   */
  ordersSlug?: string
  paymentMethod: PaymentAdapter
  /**
   * The slug of the products collection, defaults to 'products'.
   */
  productsSlug?: string
  /**
   * The slug of the transactions collection, defaults to 'transactions'.
   */
  transactionsSlug?: string
  /**
   * The slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
}

type ConfirmOrder = (args: Args) => Endpoint['handler']

/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export const confirmOrderHandler: ConfirmOrder =
  ({
    ordersSlug = 'orders',
    paymentMethod,
    productsSlug = 'products',
    transactionsSlug = 'transactions',
    variantsSlug = 'variants',
  }) =>
  async (req) => {
    await addDataAndFileToRequest(req)

    const data = req.data
    const payload = req.payload
    const user = req.user

    let cart = data?.cart

    let customerEmail: string = user?.email ?? ''

    if (user) {
      if (user.cart && Array.isArray(user.cart) && user.cart.length > 0) {
        // If the user has a cart, use it
        if (cart && Array.isArray(cart) && cart.length > 0) {
          return Response.json(
            {
              message: 'You cannot initiate a payment with both a user cart and a provided cart.',
            },
            {
              status: 400,
            },
          )
        }

        // Use the user's cart instead
        cart = user.cart
      }
    } else {
      // Get the email from the data if user is not available
      if (data?.customerEmail && typeof data.customerEmail === 'string') {
        customerEmail = data.customerEmail
      } else {
        return Response.json(
          {
            message: 'A customer email is required to make a purchase.',
          },
          {
            status: 400,
          },
        )
      }
    }

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return Response.json(
        {
          message: 'Cart is required and must be an array with at least one item',
        },
        {
          status: 400,
        },
      )
    }

    const sanitizedCart: Cart = []

    try {
      if (Array.isArray(cart) && cart.length > 0) {
        for (const item of cart) {
          const quantity = item.quantity || 1

          if (item.variant) {
            const id = typeof item.variant === 'object' ? item.variant.id : item.variant

            const variant = await payload.findByID({
              id,
              collection: variantsSlug,
              depth: 0,
              select: {
                inventory: true,
              },
            })

            if (!variant) {
              return Response.json(
                {
                  message: `Variant with ID ${item.variant} not found`,
                },
                {
                  status: 404,
                },
              )
            }

            if (variant.inventory && typeof variant.inventory === 'number') {
              if (
                variant.inventory === 0 ||
                (variant.inventory &&
                  typeof variant.inventory === 'number' &&
                  variant.inventory < quantity)
              ) {
                return Response.json(
                  {
                    message: `Variant with ID ${item.variant} is out of stock or does not have enough inventory`,
                  },
                  {
                    status: 400,
                  },
                )
              }

              await payload.update({
                id: item.variant,
                collection: variantsSlug,
                data: {
                  inventory: variant.inventory - quantity,
                },
              })

              sanitizedCart.push({
                productID: item.product
                  ? typeof item.product === 'object'
                    ? item.product.id
                    : item.product
                  : null,
                quantity,
                variantID: id,
              })
            }
          }

          // If the item has a product but no variant, we assume the product has a price in the specified currency
          if (item.product && !item.variant) {
            const id = typeof item.product === 'object' ? item.product.id : item.product

            const product = await payload.findByID({
              id,
              collection: productsSlug,
              depth: 0,
              select: {
                inventory: true,
              },
            })
            if (!product) {
              return Response.json(
                {
                  message: `Product with ID ${item.product} not found`,
                },
                {
                  status: 404,
                },
              )
            }

            if (product.inventory && typeof product.inventory === 'number') {
              if (product.inventory === 0 || product.inventory < quantity) {
                return Response.json(
                  {
                    message: `Variant with ID ${item.variant} is out of stock or does not have enough inventory`,
                  },
                  {
                    status: 400,
                  },
                )
              }

              await payload.update({
                id: item.product,
                collection: productsSlug,
                data: {
                  inventory: product.inventory - quantity,
                },
              })

              sanitizedCart.push({
                productID: id,
                quantity,
              })
            }
          }
        }
      }

      const paymentResponse = await paymentMethod.confirmOrder({
        data: {
          ...data,
          cart: sanitizedCart,
          customerEmail,
        },
        ordersSlug,
        req,
        transactionsSlug,
      })

      return Response.json(paymentResponse)
    } catch (error) {
      payload.logger.error(error, 'Error initiating payment')

      return Response.json(
        {
          message: 'Error initiating payment',
        },
        {
          status: 500,
        },
      )
    }
  }
