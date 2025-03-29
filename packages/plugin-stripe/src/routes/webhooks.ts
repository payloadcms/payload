import type { Config as PayloadConfig, PayloadRequest } from 'payload'

import Stripe from 'stripe'

import type { StripePluginConfig } from '../types.js'

import { handleWebhooks } from '../webhooks/index.js'

export const stripeWebhooks = async (args: {
  config: PayloadConfig
  pluginConfig: StripePluginConfig
  req: PayloadRequest
}): Promise<any> => {
  const { config, pluginConfig, req } = args
  let returnStatus = 200

  const { stripeSecretKey, stripeWebhooksEndpointSecret, webhooks } = pluginConfig

  if (stripeWebhooksEndpointSecret) {
    const stripe = new Stripe(stripeSecretKey, {
      // api version can only be the latest, stripe recommends ts ignoring it
      apiVersion: '2022-08-01',
      appInfo: {
        name: 'Stripe Payload Plugin',
        url: 'https://payloadcms.com',
      },
    })

    const body = await req.text()
    const stripeSignature = req.headers.get('stripe-signature')

    if (stripeSignature) {
      let event: Stripe.Event | undefined

      try {
        event = stripe.webhooks.constructEvent(body, stripeSignature, stripeWebhooksEndpointSecret)
      } catch (err: unknown) {
        const msg: string = err instanceof Error ? err.message : JSON.stringify(err)
        req.payload.logger.error(`Error constructing Stripe event: ${msg}`)
        returnStatus = 400
      }

      if (event) {
        try {
          // Wait for all webhook handlers to complete
          await Promise.all([
            // Automatic sync webhook handler
            handleWebhooks({
              config,
              event,
              payload: req.payload,
              pluginConfig,
              req,
              stripe,
            }),
            // Fire external webhook handler if it exists
            typeof webhooks === 'function'
              ? webhooks({
                  config,
                  event,
                  payload: req.payload,
                  pluginConfig,
                  req,
                  stripe,
                })
              : Promise.resolve(),
            // Fire external webhook handler for specific event types
            typeof webhooks === 'object' && webhooks[event.type]
              ? webhooks[event.type]({
                  config,
                  event,
                  payload: req.payload,
                  pluginConfig,
                  req,
                  stripe,
                })
              : Promise.resolve(),
          ])
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Unknown error'
          req.payload.logger.error({
            err,
            msg: `Error processing stripe webhook event ${event.type}: ${msg}`,
          })
          returnStatus = 500
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
