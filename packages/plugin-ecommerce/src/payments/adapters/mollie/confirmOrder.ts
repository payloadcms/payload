import { createMollieClient } from '@mollie/api-client'

import type { PaymentAdapter } from '../../../types/index.js'
import type { MollieAdapterArgs } from './index.js'

import { getOrCreateMollieCustomer } from './utils.js'

type Props = {
  apiKey: MollieAdapterArgs['apiKey']
}

export const confirmOrder: (props: Props) => NonNullable<PaymentAdapter>['confirmOrder'] =
  (props) =>
  async ({
    customersSlug = 'users',
    data,
    ordersSlug = 'orders',
    req,
    transactionsSlug = 'transactions',
  }) => {
    const payload = req.payload
    const { apiKey } = props || {}

    const customerEmail = data.customerEmail

    const paymentID = data.paymentID as string

    if (!apiKey) {
      throw new Error('Mollie API key is required')
    }

    if (!paymentID) {
      throw new Error('Payment ID is required')
    }

    if (!customerEmail || typeof customerEmail !== 'string') {
      throw new Error('A valid customer email is required to confirm an order.')
    }

    const mollie = createMollieClient({
      apiKey,
    })

    try {
      const customer = await getOrCreateMollieCustomer({
        customerEmail,
        customersSlug,
        mollie,
        payload,
      })

      // Find our existing transaction by the payment intent ID
      const transactionsResults = await payload.find({
        collection: transactionsSlug,
        where: {
          'mollie.paymentID': {
            equals: paymentID,
          },
        },
      })

      const transaction = transactionsResults.docs[0]

      if (!transactionsResults.totalDocs || !transaction) {
        throw new Error('No transaction found for the provided Payment ID')
      }

      // Verify the payment intent exists and retrieve it
      const payment = await mollie.payments.get(paymentID)
      const metadata = payment.metadata as
        | {
            cartID?: string
            cartItemsSnapshot?: string
            shippingAddress?: string
          }
        | undefined

      const cartID = metadata?.cartID
      const cartItemsSnapshot = metadata?.cartItemsSnapshot
        ? JSON.parse(metadata.cartItemsSnapshot)
        : undefined

      const shippingAddress = metadata?.shippingAddress
        ? JSON.parse(metadata.shippingAddress)
        : undefined

      if (!cartID) {
        throw new Error('Cart ID not found in the Payment metadata')
      }

      if (!cartItemsSnapshot || !Array.isArray(cartItemsSnapshot)) {
        throw new Error('Cart items snapshot not found or invalid in the Payment metadata')
      }

      const order = await payload.create({
        collection: ordersSlug,
        data: {
          amount: Number(payment.amount.value) * 100,
          currency: payment.amount.currency,
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          items: cartItemsSnapshot,
          shippingAddress,
          status: 'processing',
          transactions: [transaction.id],
        },
      })

      const timestamp = new Date().toISOString()

      await payload.update({
        id: cartID,
        collection: 'carts',
        data: {
          purchasedAt: timestamp,
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
        message: 'Payment confirmed successfully',
        orderID: order.id,
        transactionID: transaction.id,
      }
    } catch (error) {
      payload.logger.error(error, 'Error confirming payment with Mollie')

      throw new Error(error instanceof Error ? error.message : 'Unknown error confirming payment')
    }
  }
