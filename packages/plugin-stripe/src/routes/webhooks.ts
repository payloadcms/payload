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

      /**
       * Run webhook handlers asynchronously in a separate endpoint.
       * This allows the request to immediately return a 2xx status code to Stripe without waiting for the webhook handlers to complete.
       * This is important because Stripe will retry the webhook if it doesn't receive a 2xx status code within the 10-20 second timeout window.
       * This is because webhooks can be potentially slow if performing database queries or other synchronous API requests.
       * When a webhook fails, Stripe will retry it, causing duplicate events and potential data inconsistencies.
       * {@link https://docs.stripe.com/webhooks#acknowledge-events-immediately}
       */
      if (event) {
        void handleWebhooks({
          config,
          event,
          payload: req.payload,
          pluginConfig,
          req,
          stripe,
        })

        // Fire external webhook handlers if they exist
        if (typeof webhooks === 'function') {
          void webhooks({
            config,
            event,
            payload: req.payload,
            pluginConfig,
            req,
            stripe,
          })
        }

        if (typeof webhooks === 'object') {
          const webhookEventHandler = webhooks[event.type]
          if (typeof webhookEventHandler === 'function') {
            void webhookEventHandler({
              config,
              event,
              payload: req.payload,
              pluginConfig,
              req,
              stripe,
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
