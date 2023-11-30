import type { Response } from 'express'
import type { Config as PayloadConfig } from 'payload/config'
import type { PayloadRequest } from 'payload/dist/types'

import Stripe from 'stripe'

import type { StripeConfig } from '../types'

import { handleWebhooks } from '../webhooks'

export const stripeWebhooks = async (args: {
  config: PayloadConfig
  next: any
  req: PayloadRequest
  res: Response
  stripeConfig: StripeConfig
}): Promise<any> => {
  const { config, req, res, stripeConfig } = args

  const { stripeSecretKey, stripeWebhooksEndpointSecret, webhooks } = stripeConfig

  if (stripeWebhooksEndpointSecret) {
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-08-01',
      appInfo: {
        name: 'Stripe Payload Plugin',
        url: 'https://payloadcms.com',
      },
    })

    const stripeSignature = req.headers['stripe-signature']

    if (stripeSignature) {
      let event: Stripe.Event | undefined

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          stripeSignature,
          stripeWebhooksEndpointSecret,
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : err
        req.payload.logger.error(`Error constructing Stripe event: ${msg}`)
        res.status(400)
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

  res.json({ received: true })
}
