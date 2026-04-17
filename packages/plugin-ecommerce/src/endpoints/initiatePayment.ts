import { addDataAndFileToRequest, type DefaultDocumentIDType, type Endpoint } from 'payload'

import type {
  CurrenciesConfig,
  PaymentAdapter,
  PaymentHooks,
  ProductsValidation,
  SanitizedEcommercePluginConfig,
  Summary,
} from '../types/index.js'

import { defaultProductsValidation } from '../utilities/defaultProductsValidation.js'
import { runBeforeInitiatePaymentHooks } from '../utilities/runPaymentHooks.js'

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
   * Whether the transactions collection has the `summary` field. When true,
   * the handler will persist the computed summary onto the transaction record
   * after the adapter returns.
   */
  hasHooks?: boolean
  /**
   * Track inventory stock for the products and variants.
   * Accepts an object to override the default field name.
   */
  inventory?: SanitizedEcommercePluginConfig['inventory']
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

type InitiatePayment = (args: Args) => Endpoint['handler']

/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export const initiatePaymentHandler: InitiatePayment =
  ({
    cartsSlug = 'carts',
    currenciesConfig,
    customersSlug = 'users',
    hasHooks = false,
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
    const billingAddress = data?.billingAddress
    const shippingAddress = data?.shippingAddress
    const cartSecret = data?.secret

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

    // Ensure the selected currency is supported
    if (
      !currenciesConfig.supportedCurrencies.find(
        (c) => c.code.toLocaleLowerCase() === currency.toLocaleLowerCase(),
      )
    ) {
      return Response.json(
        {
          message: `Currency ${currency} is not supported.`,
        },
        {
          status: 400,
        },
      )
    }

    // Verify the cart is available and items are present in an array
    if (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
      return Response.json(
        {
          message: 'Cart is required and must contain at least one item.',
        },
        {
          status: 400,
        },
      )
    }

    for (const item of cart.items) {
      // Target field to check the price based on the currency so we can validate the total
      const priceField = `priceIn${currency.toUpperCase()}`
      const quantity = item.quantity || 1

      // If the item has a product but no variant, we assume the product has a price in the specified currency
      if (item.product && !item.variant) {
        const id = typeof item.product === 'object' ? item.product.id : item.product

        const product = await payload.findByID({
          id,
          collection: productsSlug,
          depth: 0,
          select: {
            inventory: true,
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

        try {
          if (productsValidation) {
            await productsValidation({ currenciesConfig, currency, product, quantity })
          } else {
            await defaultProductsValidation({
              currenciesConfig,
              currency,
              product,
              quantity,
            })
          }
        } catch (error) {
          payload.logger.error(
            error,
            'Error validating product or variant during payment initiation.',
          )

          return Response.json(
            {
              message: error,
              ...(error instanceof Error ? { cause: error.cause } : {}),
            },
            {
              status: 400,
            },
          )
        }

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

          try {
            if (productsValidation) {
              await productsValidation({
                currenciesConfig,
                currency,
                product: item.product,
                quantity,
                variant,
              })
            } else {
              await defaultProductsValidation({
                currenciesConfig,
                currency,
                product: item.product,
                quantity,
                variant,
              })
            }
          } catch (error) {
            payload.logger.error(
              error,
              'Error validating product or variant during payment initiation.',
            )

            return Response.json(
              {
                message: error,
              },
              {
                status: 400,
              },
            )
          }
        }
      }
    }

    // Build the initial payment summary from the cart subtotal, then run hooks
    // (plugin-level then adapter-level) to append tax, shipping, discounts, etc.
    const cartSubtotal = cart.subtotal ?? 0
    let summary: Summary = {
      currency,
      lines: [{ type: 'subtotal', amount: cartSubtotal, label: 'Subtotal' }],
      total: cartSubtotal,
    }

    const pluginHooks = paymentHooks?.beforeInitiatePayment ?? []
    const adapterHooks = paymentMethod.hooks?.beforeInitiatePayment ?? []
    const allBeforeInitiateHooks = [...pluginHooks, ...adapterHooks]

    if (allBeforeInitiateHooks.length > 0) {
      try {
        summary = await runBeforeInitiatePaymentHooks(allBeforeInitiateHooks, {
          billingAddress,
          cart,
          currenciesConfig,
          currency,
          customerEmail,
          req,
          shippingAddress,
          summary,
        })
      } catch (error) {
        payload.logger.error(error, 'Error in beforeInitiatePayment hook.')

        return Response.json(
          {
            message:
              error instanceof Error ? error.message : 'Error in beforeInitiatePayment hook.',
          },
          {
            status: 400,
          },
        )
      }
    }

    if (summary.total <= 0) {
      return Response.json(
        {
          message: 'Total after adjustments must be greater than zero.',
        },
        {
          status: 400,
        },
      )
    }

    try {
      const paymentResponse = await paymentMethod.initiatePayment({
        customersSlug,
        data: {
          billingAddress,
          cart,
          currency,
          customerEmail,
          shippingAddress,
          summary,
        },
        req,
        transactionsSlug,
      })

      // Persist the summary onto the transaction so the breakdown is queryable
      // later (receipts, refunds, reporting). The adapter returns the transactionID
      // when it has created a record; if not, persistence is skipped gracefully.
      if (hasHooks && paymentResponse.transactionID) {
        try {
          await payload.update({
            id: paymentResponse.transactionID,
            collection: transactionsSlug,
            data: { summary },
            overrideAccess: true,
            req,
          })
        } catch (error) {
          payload.logger.error(error, 'Failed to persist summary onto transaction.')
        }
      }

      return Response.json({ ...paymentResponse, summary })
    } catch (error) {
      payload.logger.error(error, 'Error initiating payment.')

      return Response.json(
        {
          message: 'Error initiating payment.',
        },
        {
          status: 500,
        },
      )
    }
  }
