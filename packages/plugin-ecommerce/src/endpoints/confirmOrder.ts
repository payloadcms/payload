import { addDataAndFileToRequest, type DefaultDocumentIDType, type Endpoint } from 'payload'

import type { Cart, CurrenciesConfig, PaymentAdapter } from '../types.js'

type Args = {
  /**
   * The slug of the carts collection, defaults to 'carts'.
   */
  cartsSlug?: string
  currenciesConfig: CurrenciesConfig
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
    cartsSlug = 'carts',
    currenciesConfig,
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

    let currency: string = currenciesConfig.defaultCurrency
    let cartID: DefaultDocumentIDType = data?.cartID
    let cart = undefined
    let customerEmail: string = user?.email ?? ''

    if (user) {
      if (user.cart?.docs && Array.isArray(user.cart.docs) && user.cart.docs.length > 0) {
        if (!cartID && user.cart.docs[0]) {
          // Use the user's cart instead
          if (typeof user.cart.docs[0] === 'object') {
            cartID = user.cart.docs[0].id
            cart = user.cart.docs[0]
          } else {
            cartID = user.cart.docs[0]
          }
        }
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

    if (!cart) {
      if (cartID) {
        cart = await payload.findByID({
          id: cartID,
          collection: cartsSlug,
          depth: 2,
          overrideAccess: false,
          select: {
            id: true,
            currency: true,
            customerEmail: true,
            items: true,
            subtotal: true,
          },
          user,
        })

        if (!cart) {
          return Response.json(
            {
              message: `Cart with ID ${cartID} not found.`,
            },
            {
              status: 404,
            },
          )
        }
      } else {
        return Response.json(
          {
            message: 'Cart ID is required.',
          },
          {
            status: 400,
          },
        )
      }
    }

    if (cart.currency && typeof cart.currency === 'string') {
      currency = cart.currency
    }

    // Ensure the currency is provided or inferred in some way
    if (!currency) {
      return Response.json(
        {
          message: 'Currency is required.',
        },
        {
          status: 400,
        },
      )
    }

    try {
      if (Array.isArray(cart.items) && cart.items.length > 0) {
        for (const item of cart.items) {
          // Target field to check the price based on the currency so we can validate the total
          const priceField = `priceIn${currency.toUpperCase()}`
          const quantity = item.quantity || 1

          if (item.variant) {
            const id = typeof item.variant === 'object' ? item.variant.id : item.variant

            const variant = await payload.findByID({
              id,
              collection: variantsSlug,
              depth: 0,
              select: {
                inventory: true,
                [priceField]: true,
              },
            })

            if (!variant) {
              return Response.json(
                {
                  message: `Variant with ID ${item.variant} not found.`,
                },
                {
                  status: 404,
                },
              )
            }

            if (!variant[priceField]) {
              return Response.json(
                {
                  message: `Variant with ID ${item.variant} does not have a price in ${currency}.`,
                },
                {
                  status: 400,
                },
              )
            }

            if (variant.inventory === 0 || (variant.inventory && variant.inventory < quantity)) {
              return Response.json(
                {
                  message: `Variant with ID ${item.variant} is out of stock or does not have enough inventory.`,
                },
                {
                  status: 400,
                },
              )
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
                [priceField]: true,
              },
            })

            if (!product) {
              return Response.json(
                {
                  message: `Product with ID ${item.product} not found.`,
                },
                {
                  status: 404,
                },
              )
            }
            if (!product[priceField]) {
              return Response.json(
                {
                  message: `Product with ID ${item.product} does not have a price in ${currency}.`,
                },
                {
                  status: 400,
                },
              )
            }

            if (product.inventory === 0 || (product.inventory && product.inventory < quantity)) {
              return Response.json(
                {
                  message: `Variant with ID ${item.variant} is out of stock or does not have enough inventory.`,
                },
                {
                  status: 400,
                },
              )
            }
          }
        }
      }

      const paymentResponse = await paymentMethod.confirmOrder({
        data: {
          ...data,
          cart,
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
