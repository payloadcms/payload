import type { Config } from 'payload/config'
import type { PayloadRequest } from 'payload/types'

import bodyParser from 'body-parser'

import type { SanitizedStripeConfig, StripeConfig } from './types.js'

import { getFields } from './fields/getFields.js'
import { createNewInStripe } from './hooks/createNewInStripe.js'
import { deleteFromStripe } from './hooks/deleteFromStripe.js'
import { syncExistingWithStripe } from './hooks/syncExistingWithStripe.js'
import { stripeREST } from './routes/rest.js'
import { stripeWebhooks } from './routes/webhooks.js'

const stripePlugin =
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
      endpoints: [
        ...(config?.endpoints || []),
        {
          handler: [
            // TODO: test if this works, was using express.raw() before
            bodyParser.raw({ type: 'application/json' }),
            async (req, res, next) => {
              await stripeWebhooks({
                config,
                next,
                req,
                res,
                stripeConfig,
              })
            },
          ],
          method: 'post',
          path: '/stripe/webhooks',
          root: true,
        },
        ...(incomingStripeConfig?.rest
          ? [
              {
                handler: async (req: PayloadRequest, res: Response, next: NextFunction) => {
                  await stripeREST({
                    next,
                    req,
                    res,
                    stripeConfig,
                  })
                },
                method: 'post',
                path: '/stripe/rest',
              },
            ]
          : []),
      ],
    }
  }

export default stripePlugin
