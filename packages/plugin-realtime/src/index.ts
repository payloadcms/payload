/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type CollectionAfterChangeHook,
  type CollectionAfterDeleteHook,
  type Config,
  type Payload,
} from 'payload'

// export type MyPluginConfig = {
//   /**
//    * List of collections to add a custom field
//    */
// }

export const realtimePlugin =
  (/**pluginOptions: MyPluginConfig */) =>
  (config: Config): Config => {
    const myAfterChangeHook: CollectionAfterChangeHook = (args) => {
      // If the collection that changed has a registered reactive count, we have to trigger all its count listeners
      // If the collection that changed has a registered find and satisfies the where of the options, we have to trigger all its find listeners
      // If the document that changed has findById registered, we have to trigger all its find listeners
      console.log('myAfterChangeHook', args)
      return args
    }

    const myAfterDeleteHook: CollectionAfterDeleteHook = (args) => {
      // If the collection that changed has a registered reactive count, we have to trigger all its count listeners
      // If the collection that changed has a registered find and satisfies the where of the options, we have to trigger all its find listeners
      // If the document that changed has findById registered, we have to trigger all its find listeners (set to null)
      console.log('myAfterDeleteHook', args)
      return args
    }

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
    }
  }

type OnChange<T> = ({ onChange }: { onChange: (value: T) => void }) => T

type PayloadReactiveType = {
  count: (
    ...args: [Payload, ...Parameters<Payload['count']>, OnChange<ReturnType<Payload['count']>>]
  ) => void
  find: (
    ...args: [Payload, ...Parameters<Payload['find']>, OnChange<ReturnType<Payload['find']>>]
  ) => void
  findByID: (
    ...args: [
      Payload,
      ...Parameters<Payload['findByID']>,
      OnChange<ReturnType<Payload['findByID']>>,
    ]
  ) => void
}

export const payloadReactive: PayloadReactiveType = {
  count: (payload, options, onChange) => {
    // payload.count(options)
  },
  find: (payload, options, onChange) => {
    // return payload.find(...originalArgs)
  },
  findByID: (payload, options, onChange) => {
    // return payload.findByID(...originalArgs)
  },
}
