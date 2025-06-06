import { addDataAndFileToRequest, type Endpoint } from 'payload'

import type { Cart, CurrenciesConfig, PaymentAdapter } from '../types.js'

type Args = {
  currenciesConfig: CurrenciesConfig
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

type InitiatePayment = (args: Args) => Endpoint['handler']

/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export const initiatePaymentHandler: InitiatePayment =
  ({
    currenciesConfig,
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

    const currency = data?.currency as string
    const cart = data?.cart

    let customerEmail: string = user?.email ?? ''

    // Get the email from the data if user is not available
    if (!user) {
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

    if (!currency) {
      return Response.json(
        {
          message: 'Currency is required',
        },
        {
          status: 400,
        },
      )
    }

    if (
      !currenciesConfig.supportedCurrencies.find(
        (c) => c.code.toLocaleLowerCase() === currency.toLocaleLowerCase(),
      )
    ) {
      return Response.json(
        {
          message: `Currency ${currency} is not supported`,
        },
        {
          status: 400,
        },
      )
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

    let internalTotal = 0

    for (const item of cart) {
      // Target field to check the price based on the currency so we can validate the total
      const priceField = `priceIn${currency.toUpperCase()}`
      const quantity = item.quantity || 1

      if (item.variant) {
        const variant = await payload.findByID({
          id: item.variant,
          collection: variantsSlug,
          depth: 0,
          select: {
            [priceField]: true,
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

        if (!variant[priceField] || !variant[priceField].amount) {
          return Response.json(
            {
              message: `Variant with ID ${item.variant} does not have a price in ${currency}`,
            },
            {
              status: 400,
            },
          )
        }

        internalTotal += variant[priceField].amount * quantity
      }

      if (item.product) {
        const product = await payload.findByID({
          id: item.product,
          collection: productsSlug,
          depth: 0,
          select: {
            [priceField]: true,
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
        if (!product[priceField] || !product[priceField].amount) {
          return Response.json(
            {
              message: `Product with ID ${item.product} does not have a price in ${currency}`,
            },
            {
              status: 400,
            },
          )
        }
        internalTotal += product[priceField].amount * quantity
      }
    }

    const sanitisedCart: Cart = cart as Cart

    try {
      const paymentResponse = await paymentMethod.initiatePayment({
        data: {
          cart: sanitisedCart,
          currency,
          customerEmail,
          total: internalTotal,
        },
        req,
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
