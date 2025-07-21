import Stripe from 'stripe'

import type { PaymentAdapter } from '../../../types.js'
import type { StripeAdapterArgs } from './index.js'

type Props = {
  apiVersion?: Stripe.StripeConfig['apiVersion']
  appInfo?: Stripe.StripeConfig['appInfo']
  secretKey: StripeAdapterArgs['secretKey']
}

export const confirmOrder: (props: Props) => NonNullable<PaymentAdapter>['confirmOrder'] =
  (props) =>
  async ({
    cartsSlug = 'carts',
    data,
    ordersSlug = 'orders',
    req,
    transactionsSlug = 'transactions',
  }) => {
    const payload = req.payload
    const { apiVersion, appInfo, secretKey } = props || {}

    const customerEmail = data.customerEmail
    const user = req.user

    const paymentIntentID = data.paymentIntentID as string

    if (!secretKey) {
      throw new Error('Stripe secret key is required')
    }

    if (!paymentIntentID) {
      throw new Error('PaymentIntent ID is required')
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

      // Find our existing transaction by the payment intent ID
      const transactionsResults = await payload.find({
        collection: transactionsSlug,
        where: {
          'stripe.paymentIntentID': {
            equals: paymentIntentID,
          },
        },
      })

      const transaction = transactionsResults.docs[0]

      if (!transactionsResults.totalDocs || !transaction) {
        throw new Error('No transaction found for the provided PaymentIntent ID')
      }

      // Verify the payment intent exists and retrieve it
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID)

      console.log({ paymentIntent })

      const cartID = paymentIntent.metadata.cartID
      const cartItemsSnapshot = paymentIntent.metadata.cartItemsSnapshot
        ? JSON.parse(paymentIntent.metadata.cartItemsSnapshot)
        : undefined

      if (!cartID) {
        throw new Error('Cart ID not found in the PaymentIntent metadata')
      }

      if (!cartItemsSnapshot || !Array.isArray(cartItemsSnapshot)) {
        throw new Error('Cart items snapshot not found or invalid in the PaymentIntent metadata')
      }

      console.log({ cartItemsSnapshot })

      const cart = await payload.findByID({
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

      const order = await payload.create({
        collection: ordersSlug,
        data: {
          amount: paymentIntent.amount,
          cart: cart.id,
          currency: paymentIntent.currency.toUpperCase(),
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          items: cartItemsSnapshot,
          status: 'processing',
          transactions: [transaction.id],
        },
      })

      await payload.update({
        id: transaction.id,
        collection: transactionsSlug,
        data: {
          order: order.id,
          status: 'succeeded',
        },
      })

      return {
        message: 'Payment initiated successfully',
        order,
        orderID: order.id,
      }
    } catch (error) {
      payload.logger.error(error, 'Error initiating payment with Stripe')

      throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
    }
  }
