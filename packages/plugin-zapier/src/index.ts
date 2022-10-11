import type { Config } from 'payload/config'
import type { PluginOptions } from './types'

export const zapierPlugin =
  (options: PluginOptions) =>
  (config: Config): Config => {
    const headers = {
      'Content-Type': 'application/json',
    }
    return {
      ...config,
      collections: (config.collections || []).map(existingCollection => {
        const collectionOptions = options.collections.find(
          ({ slug }) => slug === existingCollection.slug,
        )

        if (collectionOptions) {
          return {
            ...existingCollection,
            hooks: {
              ...(existingCollection.hooks || {}),
              afterChange: [
                ({ doc, operation }) => {
                  if (collectionOptions.webhook) {
                    fetch(collectionOptions.webhook, {
                      method: operation === 'create' ? 'POST' : 'PUT',
                      body: JSON.stringify({
                        operation,
                        collection: existingCollection.slug,
                        ...doc,
                      }),
                      headers,
                    })
                  }
                },
                ...(existingCollection.hooks?.afterChange ?? []),
              ],
              afterDelete: [
                ({ doc }) => {
                  if (collectionOptions.webhook) {
                    fetch(collectionOptions.webhook, {
                      method: 'DELETE',
                      body: JSON.stringify({
                        operation: 'delete',
                        collection: existingCollection.slug,
                        ...doc,
                      }),
                      headers,
                    })
                  }
                },
                ...(existingCollection.hooks?.afterDelete ?? []),
              ],
            },
          }
        }

        return existingCollection
      }),
    }
  }
