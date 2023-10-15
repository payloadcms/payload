import payload from 'payload'
import type { Config } from 'payload/config'
import type { CollectionConfig } from 'payload/dist/collections/config/types'

import type { PluginConfig, ShouldSendZap, Zap } from './types'

const zap: Zap = ({ collectionSlug, data, operation, webhookURL }) =>
  fetch(webhookURL, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: {
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE',
    }[operation],
    body: JSON.stringify({
      collectionSlug,
      operation,
      data,
    }),
  })

const shouldSendZap: ShouldSendZap = async ({ enabled, hookArgs, operation }) => {
  if (typeof enabled === 'function') {
    try {
      return await enabled({ ...hookArgs, operation })
    } catch (error: unknown) {
      payload.logger.error(`🚨 [Zapier plugin]: Error checking enabled status on. ${error}`)
      return false
    }
  }

  return enabled ?? true
}

export const zapierPlugin =
  (options: PluginConfig) =>
  (config: Config): Config => {
    const { collections: zapCollections, webhookURL, enabled } = options

    return {
      ...config,
      collections: (config.collections || []).map((collection: CollectionConfig) => {
        const allCollections = zapCollections[0] === '*'
        const isZapCollection =
          allCollections || zapCollections?.find(slug => slug === collection.slug)

        if (!isZapCollection) return collection

        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: [
              ...(collection.hooks?.afterChange || []),
              async hookArgs => {
                const { operation, doc } = hookArgs

                if (await shouldSendZap({ enabled, hookArgs, operation })) {
                  zap({
                    collectionSlug: collection.slug,
                    operation,
                    data: doc,
                    webhookURL,
                  })
                }
              },
            ],
            afterDelete: [
              ...(collection.hooks?.afterDelete || []),
              async hookArgs => {
                const operation = 'delete'

                if (await shouldSendZap({ enabled, hookArgs, operation })) {
                  zap({
                    collectionSlug: collection.slug,
                    operation,
                    data: hookArgs.doc,
                    webhookURL,
                  })
                }
              },
            ],
          },
        }
      }),
    }
  }
