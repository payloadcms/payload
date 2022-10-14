import type { Config } from 'payload/config'
import type { CollectionConfig } from 'payload/dist/collections/config/types'
import type { PluginConfig, Zap } from './types'

const zap: Zap = ({ collectionSlug, data, operation, webhookEndpoint }) =>
  fetch(webhookEndpoint, {
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

export const zapierPlugin =
  (options: PluginConfig) =>
  (config: Config): Config => {
    const { collections: zapCollections, webhookURL: webhookEndpoint } = options

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
              ({ operation, doc }): void => {
                zap({
                  collectionSlug: collection.slug,
                  operation,
                  data: doc,
                  webhookEndpoint,
                })
              },
            ],
            afterDelete: [
              ...(collection.hooks?.afterDelete || []),
              ({ doc }): void => {
                zap({
                  collectionSlug: collection.slug,
                  operation: 'delete',
                  data: doc,
                  webhookEndpoint,
                })
              },
            ],
          },
        }
      }),
    }
  }
