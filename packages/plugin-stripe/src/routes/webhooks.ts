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
        const fireWebhooks = async () => {
          await handleWebhooks({
            config,
            event,
            payload: req.payload,
            pluginConfig,
            req,
            stripe,
          })

          // Fire external webhook handlers if they exist
          if (typeof webhooks === 'function') {
            await webhooks({
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
              await webhookEventHandler({
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

        /**
         * Run webhook handlers asynchronously. This allows the request to immediately return a 2xx status code to Stripe without waiting for the webhook handlers to complete.
         * This is because webhooks can be potentially slow if performing database queries or other synchronous API requests.
         * This is important because Stripe will retry the webhook if it doesn't receive a 2xx status code within the 10-20 second timeout window.
         * When a webhook fails, Stripe will retry it, causing duplicate events and potential data inconsistencies.
         *
         * To do this in Vercel environments, conditionally import the `waitUntil` function from `@vercel/functions`.
         * If it exists, use it to wrap the `fireWebhooks` function to ensure it completes before the response is sent.
         * Otherwise, run the `fireWebhooks` function directly and void the promise to prevent the response from waiting.
         * {@link https://docs.stripe.com/webhooks#acknowledge-events-immediately}
         */
        void (async () => {
          let waitUntil = (promise: Promise<void>) => promise

          try {
            // @ts-expect-error - Ignore TS error for missing module
            const { waitUntil: importedWaitUntil } = await import('@vercel/functions')
            waitUntil = importedWaitUntil
          } catch (_err) {
            // silently fail
          }

          void waitUntil(fireWebhooks())
        })()
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
