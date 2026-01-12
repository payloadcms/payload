import { addDataAndFileToRequest, type DefaultDocumentIDType, type Endpoint } from 'payload'

import type { CurrenciesConfig, PaymentAdapter, ProductsValidation } from '../types/index.js'

type Args = {
  /**
   * The slug of the carts collection, defaults to 'carts'.
   */
  cartsSlug?: string
  currenciesConfig: CurrenciesConfig
  /**
   * The slug of the customers collection, defaults to 'users'.
   */
  customersSlug?: string
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
   * Customise the validation used for checking products or variants before a transaction is created.
   */
  productsValidation?: ProductsValidation
  /**
   * The slug of the transactions collection, defaults to 'transactions'.
   */
  transactionsSlug?: string
  /**
   * The slug of the variants collection, defaults to 'variants'.
   */
  variantsSlug?: string
}

type ConfirmOrderHandler = (args: Args) => Endpoint['handler']

/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export const confirmOrderHandler: ConfirmOrderHandler =
  ({
    cartsSlug = 'carts',
    currenciesConfig,
    customersSlug = 'users',
    ordersSlug = 'orders',
    paymentMethod,
    productsSlug = 'products',
    productsValidation,
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
      const paymentResponse = await paymentMethod.confirmOrder({
        customersSlug,
        data: {
          ...data,
          customerEmail,
        },
        ordersSlug,
        req,
        transactionsSlug,
      })

      if (paymentResponse.transactionID) {
        const transaction = await payload.findByID({
          id: paymentResponse.transactionID,
          collection: transactionsSlug,
          depth: 0,
          select: {
            id: true,
            items: true,
          },
        })

        if (transaction && Array.isArray(transaction.items) && transaction.items.length > 0) {
          for (const item of transaction.items) {
            if (item.variant) {
              const id = typeof item.variant === 'object' ? item.variant.id : item.variant

              await payload.db.updateOne({
                id,
                collection: variantsSlug,
                data: {
                  inventory: {
                    $inc: item.quantity * -1,
                  },
                },
              })
            } else if (item.product) {
              const id = typeof item.product === 'object' ? item.product.id : item.product

              await payload.db.updateOne({
                id,
                collection: productsSlug,
                data: {
                  inventory: {
                    $inc: item.quantity * -1,
                  },
                },
              })
            }
          }
        }
      }

      if ('paymentResponse.transactionID' in paymentResponse && paymentResponse.transactionID) {
        delete (paymentResponse as Partial<typeof paymentResponse>).transactionID
      }

      return Response.json(paymentResponse)
    } catch (error) {
      payload.logger.error(error, 'Error confirming order.')

      return Response.json(
        {
          message: 'Error confirming order.',
        },
        {
          status: 500,
        },
      )
    }
  }
