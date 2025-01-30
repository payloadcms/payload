import type { Config as PayloadConfig, PayloadRequest } from 'payload'
import type Stripe from 'stripe'

import type { StripePluginConfig } from '../types.js'

import { handleWebhooks } from '../webhooks/index.js'

export type WebhookRunnerData = {
  stripe: Stripe
}

export const stripeWebhooksRunner = async (args: {
  config: PayloadConfig
  pluginConfig: StripePluginConfig
  req: PayloadRequest
}): Promise<any> => {
  const { config, pluginConfig, req } = args

  const { stripe } = req.data as WebhookRunnerData

  const returnStatus = 200

  const { webhooks } = pluginConfig

  // Fire internally defined webhooks, i.e. the `sync` config
  await handleWebhooks({
    config,
    event,
    payload: req.payload,
    pluginConfig,
    req,
    stripe,
  })

  // Fire external webhook handlers from the config, if they exist
  if (webhooks) {
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

  return Response.json(
    { received: true },
    {
      status: returnStatus,
    },
  )
}
