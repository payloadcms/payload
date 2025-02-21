import { type Config, type Payload } from 'payload'

import { payloadQueryEndpoint, payloadSSEEndpoint } from './endpoints.js'
import { myAfterChangeHook, myAfterDeleteHook } from './hooks.js'

export type QuerySubscription = {
  clients: Set<string> // clientId
  queryParams: Parameters<Payload[ReadOperation]>[0]
  type: 'count' | 'find' | 'findByID'
}

export type Query<T extends ReadOperation> = {
  queryParams: Parameters<Payload[T]>[0]
  type: T
}
export type StringifiedQuery = string

export type ReadOperation = 'count' | 'find' | 'findByID'

export const realtimePlugin =
  () =>
  (config: Config): Config => {
    return {
      ...config,
      collections: config.collections?.map((collection) => {
        return {
          ...collection,
          hooks: {
            ...collection.hooks,
            afterChange: [...(collection.hooks?.afterChange || []), myAfterChangeHook],
            afterDelete: [...(collection.hooks?.afterDelete || []), myAfterDeleteHook],
          },
        }
      }),
      endpoints: [...(config.endpoints || []), payloadQueryEndpoint, payloadSSEEndpoint],
    }
  }
