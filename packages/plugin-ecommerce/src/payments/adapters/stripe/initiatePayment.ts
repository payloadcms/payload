import Stripe from 'stripe'

import type { PaymentAdapter } from '../../../types.js'
import type { InitiatePaymentReturnType, StripeAdapterArgs } from './index.js'

type Props = {
  apiVersion?: Stripe.StripeConfig['apiVersion']
  appInfo?: Stripe.StripeConfig['appInfo']
  secretKey: StripeAdapterArgs['secretKey']
}

export const initiatePayment: (props: Props) => NonNullable<PaymentAdapter>['initiatePayment'] =
  (props) =>
  async ({ data, req }) => {
    const payload = req.payload
    const { apiVersion, appInfo, secretKey } = props || {}

    const amount = data.total
    const customerEmail = data.customerEmail
    const currency = data.currency
    const cart = data.cart

    if (!secretKey) {
      throw new Error('Stripe secret key is required')
    }

    const stripe = new Stripe(secretKey, {
      // API version can only be the latest, stripe recommends ts ignoring it
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - ignoring since possible versions are not type safe, only the latest version is recognised
      apiVersion: apiVersion || '2025-03-31.basil',
      appInfo: appInfo || {
        name: 'Stripe Payload Plugin',
        url: 'https://payloadcms.com',
      },
    })

    try {
      let customer = (
        await stripe.customers.list({
          email: customerEmail,
        })
      ).data[0]

      if (!customer?.id) {
        customer = await stripe.customers.create({
          email: customerEmail,
        })
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customer.id,
        metadata: {
          cart: JSON.stringify(cart),
        },
      })

      // Create a record of the payment intent in the database
      const transaction = await payload.create({
        collection: 'transactions',
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount: paymentIntent.amount,
          currency: paymentIntent.currency.toUpperCase(),
          paymentMethod: 'stripe',
          status: 'pending',
          stripe: {
            customerID: customer.id,
            paymentIntentID: paymentIntent.id,
          },
        },
      })

      const returnData: InitiatePaymentReturnType = {
        clientSecret: paymentIntent.client_secret || '',
        message: 'Payment initiated successfully',
        paymentIntentID: paymentIntent.id,
      }

      return returnData
    } catch (error) {
      payload.logger.error(error, 'Error initiating payment with Stripe')

      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
    }
  }
