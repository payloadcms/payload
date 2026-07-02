import { addDataAndFileToRequest, type DefaultDocumentIDType, type Endpoint } from 'payload'

import type {
  CurrenciesConfig,
  PaymentAdapter,
  PaymentHooks,
  ProductsValidation,
} from '../types/index.js'

import {
  runAfterConfirmOrderHooks,
  runBeforeConfirmOrderHooks,
} from '../utilities/runPaymentHooks.js'

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
   * Whether the transactions/orders collections have the `summary` field.
   * When true, the handler copies the summary from the transaction onto the
   * created order and includes it in the response.
   */
  hasHooks?: boolean
  /**
   * The slug of the orders collection, defaults to 'orders'.
   */
  ordersSlug?: string
  /**
   * Plugin-level payment hooks that run for all payment methods.
   */
  paymentHooks?: PaymentHooks
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
    hasHooks = false,
    ordersSlug = 'orders',
    paymentHooks,
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
    const cartSecret = data?.secret

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
        // Add cart secret to query for guest cart access control
        if (cartSecret && typeof cartSecret === 'string') {
          req.query = req.query || {}
          req.query.secret = cartSecret
        }

        cart = await payload.findByID({
          id: cartID,
          collection: cartsSlug,
          depth: 2,
          overrideAccess: false,
          req,
          select: {
            id: true,
            currency: true,
            customerEmail: true,
            items: true,
            subtotal: true,
          },
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

    // Run beforeConfirmOrder hooks (plugin-level then adapter-level)
    const pluginBeforeHooks = paymentHooks?.beforeConfirmOrder ?? []
    const adapterBeforeHooks = paymentMethod.hooks?.beforeConfirmOrder ?? []
    const allBeforeConfirmHooks = [...pluginBeforeHooks, ...adapterBeforeHooks]

    if (allBeforeConfirmHooks.length > 0) {
      try {
        await runBeforeConfirmOrderHooks(allBeforeConfirmHooks, {
          customerEmail,
          data: data as Record<string, unknown>,
          req,
        })
      } catch (error) {
        payload.logger.error(error, 'Error in beforeConfirmOrder hook.')

        return Response.json(
          {
            message: error instanceof Error ? error.message : 'Error in beforeConfirmOrder hook.',
          },
          {
            status: 400,
          },
        )
      }
    }

    try {
      const paymentResponse = await paymentMethod.confirmOrder({
        cartsSlug,
        customersSlug,
        data: {
          ...data,
          customerEmail,
        },
        ordersSlug,
        req,
        transactionsSlug,
      })

      let persistedSummary: unknown

      if (paymentResponse.transactionID) {
        const transaction = await payload.findByID({
          id: paymentResponse.transactionID,
          collection: transactionsSlug,
          depth: 0,
          select: {
            id: true,
            items: true,
            ...(hasHooks ? { summary: true } : {}),
          },
        })

        if (hasHooks && transaction && 'summary' in transaction) {
          persistedSummary = (transaction as { summary?: unknown }).summary
        }

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

      // Copy the summary from the transaction onto the order so the breakdown
      // is available on both records. Errors are logged, not thrown — the order
      // has already been successfully created by the adapter.
      if (hasHooks && paymentResponse.orderID && persistedSummary) {
        try {
          await payload.update({
            id: paymentResponse.orderID,
            collection: ordersSlug,
            data: { summary: persistedSummary },
            overrideAccess: true,
            req,
          })
        } catch (error) {
          payload.logger.error(error, 'Failed to copy summary onto order.')
        }
      }

      // Run afterConfirmOrder hooks (plugin-level then adapter-level)
      // Errors are logged but do not fail the response
      if (paymentResponse.orderID && paymentResponse.transactionID) {
        const pluginAfterHooks = paymentHooks?.afterConfirmOrder ?? []
        const adapterAfterHooks = paymentMethod.hooks?.afterConfirmOrder ?? []
        const allAfterConfirmHooks = [...pluginAfterHooks, ...adapterAfterHooks]

        if (allAfterConfirmHooks.length > 0) {
          await runAfterConfirmOrderHooks(
            allAfterConfirmHooks,
            {
              orderID: paymentResponse.orderID,
              req,
              transactionID: paymentResponse.transactionID,
            },
            payload.logger,
          )
        }
      }

      if ('paymentResponse.transactionID' in paymentResponse && paymentResponse.transactionID) {
        delete (paymentResponse as Partial<typeof paymentResponse>).transactionID
      }

      if (hasHooks && persistedSummary) {
        return Response.json({ ...paymentResponse, summary: persistedSummary })
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
