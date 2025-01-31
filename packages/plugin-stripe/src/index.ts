import type { Config, Endpoint } from 'payload'

import type { SanitizedStripePluginConfig, StripePluginConfig } from './types.js'

import { getFields } from './fields/getFields.js'
import { createNewInStripe } from './hooks/createNewInStripe.js'
import { deleteFromStripe } from './hooks/deleteFromStripe.js'
import { syncExistingWithStripe } from './hooks/syncExistingWithStripe.js'
import { stripeREST } from './routes/rest.js'
import { stripeWebhooks } from './routes/webhooks.js'

export { stripeProxy } from './utilities/stripeProxy.js'

export const stripePlugin =
  (incomingStripeConfig: StripePluginConfig) =>
  (config: Config): Config => {
    const { collections } = config

    // set config defaults here
    const pluginConfig: SanitizedStripePluginConfig = {
      ...incomingStripeConfig,
      rest: incomingStripeConfig?.rest ?? false,
      sync: incomingStripeConfig?.sync || [],
    }

    // NOTE: env variables are never passed to the client, but we need to know if `stripeSecretKey` is a test key
    // unfortunately we must set the 'isTestKey' property on the config instead of using the following code:
    // const isTestKey = stripeConfig.stripeSecretKey?.startsWith('sk_test_');

    const endpoints: Endpoint[] = [
      ...(config?.endpoints || []),
      {
        handler: async (req) => {
          const res = await stripeWebhooks({
            config,
            pluginConfig,
            req,
          })

          return res
        },
        method: 'post',
        path: '/stripe/webhooks',
      },
    ]

    if (incomingStripeConfig?.rest) {
      endpoints.push({
        handler: async (req) => {
          const res = await stripeREST({
            pluginConfig,
            req,
          })

          return res
        },
        method: 'post' as Endpoint['method'],
        path: '/stripe/rest',
      })
    }

    for (const collection of collections) {
      const { hooks: existingHooks } = collection

      const syncConfig = pluginConfig.sync?.find((sync) => sync.collection === collection.slug)

      if (!syncConfig) {
        continue
      }
      const fields = getFields({
        collection,
        pluginConfig,
        syncConfig,
      })
      collection.fields = fields

      if (!collection.hooks) {
        collection.hooks = {}
      }

      collection.hooks.afterDelete = [
        ...(existingHooks?.afterDelete || []),
        (args) =>
          deleteFromStripe({
            ...args,
            collection,
            pluginConfig,
          }),
      ]
      collection.hooks.beforeChange = [
        ...(existingHooks?.beforeChange || []),
        (args) =>
          syncExistingWithStripe({
            ...args,
            collection,
            pluginConfig,
          }),
      ]
      collection.hooks.beforeValidate = [
        ...(existingHooks?.beforeValidate || []),
        (args) =>
          createNewInStripe({
            ...args,
            collection,
            pluginConfig,
          }),
      ]
    }

    config.endpoints = endpoints

    return config
  }
