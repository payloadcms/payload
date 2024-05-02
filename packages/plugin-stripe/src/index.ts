import type { Config, Endpoint } from 'payload/config'

import type { SanitizedStripeConfig, StripeConfig } from './types.js'

import { getFields } from './fields/getFields.js'
import { createNewInStripe } from './hooks/createNewInStripe.js'
import { deleteFromStripe } from './hooks/deleteFromStripe.js'
import { syncExistingWithStripe } from './hooks/syncExistingWithStripe.js'
import { stripeREST } from './routes/rest.js'
import { stripeWebhooks } from './routes/webhooks.js'

export { LinkToDoc } from './ui/LinkToDoc.js'
export { stripeProxy } from './utilities/stripeProxy.js'

export const stripePlugin =
  (incomingStripeConfig: StripeConfig) =>
  (config: Config): Config => {
    const { collections } = config

    // set config defaults here
    const stripeConfig: SanitizedStripeConfig = {
      ...incomingStripeConfig,
      // TODO: in the next major version, default this to `false`
      rest: incomingStripeConfig?.rest ?? true,
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
            req,
            stripeConfig,
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
            req,
            stripeConfig,
          })

          return res
        },
        method: 'post' as Endpoint['method'],
        path: '/stripe/rest',
      })
    }

    return {
      ...config,
      collections: collections?.map((collection) => {
        const { hooks: existingHooks } = collection

        const syncConfig = stripeConfig.sync?.find((sync) => sync.collection === collection.slug)

        if (syncConfig) {
          const fields = getFields({
            collection,
            stripeConfig,
            syncConfig,
          })
          return {
            ...collection,
            fields,
            hooks: {
              ...collection.hooks,
              afterDelete: [
                ...(existingHooks?.afterDelete || []),
                (args) =>
                  deleteFromStripe({
                    ...args,
                    collection,
                    stripeConfig,
                  }),
              ],
              beforeChange: [
                ...(existingHooks?.beforeChange || []),
                (args) =>
                  syncExistingWithStripe({
                    ...args,
                    collection,
                    stripeConfig,
                  }),
              ],
              beforeValidate: [
                ...(existingHooks?.beforeValidate || []),
                (args) =>
                  createNewInStripe({
                    ...args,
                    collection,
                    stripeConfig,
                  }),
              ],
            },
          }
        }

        return collection
      }),
      endpoints,
    }
  }
