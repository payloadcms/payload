import { addDataAndFileToRequest, type Endpoint } from 'payload'

import type { Cart, CurrenciesConfig, PaymentAdapter } from '../types.js'

type Args = {
  currenciesConfig: CurrenciesConfig
  paymentMethod: PaymentAdapter
}

type ConfirmOrder = (args: Args) => Endpoint['handler']

/**
 * Handles the endpoint for initiating payments. We will handle checking the amount and product and variant prices here before it is sent to the payment provider.
 * This is the first step in the payment process.
 */
export const confirmOrderHandler: ConfirmOrder =
  ({ currenciesConfig, paymentMethod }) =>
  async (req) => {
    await addDataAndFileToRequest(req)

    const data = req.data
    const payload = req.payload
    const user = req.user

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

    const sanitisedCart: Cart = cart as Cart

    try {
      const paymentResponse = await paymentMethod.confirmOrder({
        data: {
          ...data,
          cart: sanitisedCart,
          customerEmail,
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
