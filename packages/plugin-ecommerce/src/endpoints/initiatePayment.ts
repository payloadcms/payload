import { addDataAndFileToRequest, type Endpoint } from 'payload'

import type {
  Cart,
  CurrenciesConfig,
  PaymentAdapter,
  SanitizedEcommercePluginConfig,
} from '../types.js'

type Args = {
  currenciesConfig: CurrenciesConfig
  /**
   * Track inventory stock for the products and variants.
   * Accepts an object to override the default field name.
   */
  inventory?: SanitizedEcommercePluginConfig['inventory']
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

    const currency = (data?.currency as string) || currenciesConfig.defaultCurrency
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
    const sanitizedCart: Cart = []

    for (const item of cart) {
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
              message: `Variant with ID ${item.variant} not found`,
            },
            {
              status: 404,
            },
          )
        }

        if (!variant[priceField]) {
          return Response.json(
            {
              message: `Variant with ID ${item.variant} does not have a price in ${currency}`,
            },
            {
              status: 400,
            },
          )
        }

        if (variant.inventory === 0 || (variant.inventory && variant.inventory < quantity)) {
          return Response.json(
            {
              message: `Variant with ID ${item.variant} is out of stock or does not have enough inventory`,
            },
            {
              status: 400,
            },
          )
        }

        sanitizedCart.push({
          productID: item.product
            ? typeof item.product === 'object'
              ? item.product.id
              : item.product
            : null,
          quantity,
          variantID: id,
        })

        internalTotal += variant[priceField] * quantity
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
              message: `Product with ID ${item.product} not found`,
            },
            {
              status: 404,
            },
          )
        }
        if (!product[priceField]) {
          return Response.json(
            {
              message: `Product with ID ${item.product} does not have a price in ${currency}`,
            },
            {
              status: 400,
            },
          )
        }

        if (product.inventory === 0 || (product.inventory && product.inventory < quantity)) {
          return Response.json(
            {
              message: `Variant with ID ${item.variant} is out of stock or does not have enough inventory`,
            },
            {
              status: 400,
            },
          )
        }

        sanitizedCart.push({
          productID: id,
          quantity,
        })

        internalTotal += product[priceField] * quantity
      }
    }

    try {
      const paymentResponse = await paymentMethod.initiatePayment({
        data: {
          cart: sanitizedCart,
          currency,
          customerEmail,
          total: internalTotal,
        },
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
