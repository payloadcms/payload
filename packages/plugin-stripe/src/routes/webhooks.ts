import type { Config as PayloadConfig } from 'payload/config'
import type { PayloadRequestWithData } from 'payload/types'

import Stripe from 'stripe'

import type { StripeConfig } from '../types.js'

import { handleWebhooks } from '../webhooks/index.js'

export const stripeWebhooks = async (args: {
  config: PayloadConfig
  req: PayloadRequestWithData
  stripeConfig: StripeConfig
}): Promise<any> => {
  const { config, req, stripeConfig } = args
  let returnStatus = 200

  const { stripeSecretKey, stripeWebhooksEndpointSecret, webhooks } = stripeConfig

  if (stripeWebhooksEndpointSecret) {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-08-01',
      appInfo: {
        name: 'Stripe Payload Plugin',
        url: 'https://payloadcms.com',
      },
    })

    const stripeSignature = req.headers.get('stripe-signature')

    if (stripeSignature) {
      let event: Stripe.Event | undefined

      try {
        event = stripe.webhooks.constructEvent(
          await req.text(),
          stripeSignature,
          stripeWebhooksEndpointSecret,
        )
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : JSON.stringify(err)
        req.payload.logger.error(`Error constructing Stripe event: ${msg}`)
        returnStatus = 400
      }

      if (event) {
        handleWebhooks({
          config,
          event,
          payload: req.payload,
          stripe,
          stripeConfig,
        })

        // Fire external webhook handlers if they exist
        if (typeof webhooks === 'function') {
          webhooks({
            config,
            event,
            payload: req.payload,
            stripe,
            stripeConfig,
          })
        }

        if (typeof webhooks === 'object') {
          const webhookEventHandler = webhooks[event.type]
          if (typeof webhookEventHandler === 'function') {
            webhookEventHandler({
              config,
              event,
              payload: req.payload,
              stripe,
              stripeConfig,
            })
          }
        }
      }
    }
  }

  return Response.json(
    { received: true },
    {
      status: returnStatus,
    },
  )
}
