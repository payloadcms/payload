import Stripe from 'stripe'

import type { PaymentAdapter } from '../../../types.js'
import type { StripeAdapterArgs } from '../index.js'

type Props = {
  apiVersion?: Stripe.StripeConfig['apiVersion']
  appInfo?: Stripe.StripeConfig['appInfo']
  secretKey: StripeAdapterArgs['secretKey']
}

export const createTransaction: (
  props: Props,
) => NonNullable<PaymentAdapter['hooks']>['createTransaction'] =
  (props) =>
  async ({ data, operation, req }) => {
    const { apiVersion, appInfo, secretKey } = props || {}
    const amount = data.amount
    const currency = data.currency

    console.log({ cartSnapshot: data.cartSnapshot[0], data })

    if (!secretKey) {
      throw new Error('Stripe secret key is required')
    }

    if (typeof amount === 'undefined') {
      throw new Error('Amount is required')
    }

    if (!currency) {
      throw new Error('Currency is required')
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
    })

    if (paymentIntent) {
      data.stripe.paymentIntentID = paymentIntent.id
      data.return = {
        paymentIntent,
      }

      req.context.ecommerce = { return: { client_secret: paymentIntent.client_secret } }
    }

    return paymentIntent
  }
