import type { Endpoint } from 'payload'

import Stripe from 'stripe'

import type { StripeAdapterArgs } from '../index.js'

type Props = {
  apiVersion?: Stripe.StripeConfig['apiVersion']
  appInfo?: Stripe.StripeConfig['appInfo']
  secretKey: StripeAdapterArgs['secretKey']
  webhooks?: StripeAdapterArgs['webhooks']
  webhookSecret: StripeAdapterArgs['webhookSecret']
}

export const webhooksEndpoint: (props: Props) => Endpoint = (props) => {
  const { apiVersion, appInfo, secretKey, webhooks, webhookSecret } = props || {}

  const handler: Endpoint['handler'] = async (req) => {
    let returnStatus = 200

    if (webhookSecret && secretKey && req.text) {
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

      const body = await req.text()
      const stripeSignature = req.headers.get('stripe-signature')

      if (stripeSignature) {
        let event: Stripe.Event | undefined

        try {
          event = stripe.webhooks.constructEvent(body, stripeSignature, webhookSecret)
        } catch (err: unknown) {
          const msg: string = err instanceof Error ? err.message : JSON.stringify(err)
          req.payload.logger.error(`Error constructing Stripe event: ${msg}`)
          returnStatus = 400
        }

        if (typeof webhooks === 'object' && event) {
          const webhookEventHandler = webhooks[event.type]

          if (typeof webhookEventHandler === 'function') {
            await webhookEventHandler({
              event,
              req,
              stripe,
            })
          }
        }
      }
    }

    return Response.json({ received: true }, { status: returnStatus })
  }

  return {
    handler,
    method: 'post',
    path: '/webhooks',
  }
}
