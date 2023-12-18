import type { Config } from 'payload/config'

import type { SanitizedStripeConfig, StripeConfig } from './types'

import { getFields } from './fields/getFields'

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
          }
        }

        return collection
      }),
    }
  }

export default stripePlugin
