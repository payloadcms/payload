/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, Config } from 'payload'

// export type MyPluginConfig = {
//   /**
//    * List of collections to add a custom field
//    */
// }

export const realtimePlugin =
  (/**pluginOptions: MyPluginConfig */) =>
  (config: Config): Config => {
    const myAfterChangeHook: CollectionAfterChangeHook = (args) => {
      console.log('myAfterChangeHook', args)
      return args
    }

    const myAfterDeleteHook: CollectionAfterDeleteHook = (args) => {
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

// type PayloadReactiveType = {
//   count: (
//     ...args: [...Parameters<Payload['count']>, OnChange<ReturnType<Payload['count']>>]
//   ) => ReturnType<Payload['count']>
//   find: (
//     ...args: [...Parameters<Payload['find']>, OnChange<ReturnType<Payload['find']>>]
//   ) => ReturnType<Payload['find']>
//   findByID: (
//     ...args: [...Parameters<Payload['findByID']>, OnChange<ReturnType<Payload['findByID']>>]
//   ) => ReturnType<Payload['findByID']>
// }

// export const payloadReactive: PayloadReactiveType = {
//   count: (options, onChange) => {
//     return payload.count(options, onChange)
//   },
//   find: (...args) => {
//     // Extract or handle the extra parameter, then use the original payload.find as needed.
//     const onChange = args.pop() as OnChange<ReturnType<Payload['find']>>
//     const originalArgs = args as Parameters<Payload['find']>
//     // return payload.find(...originalArgs)
//     return {} as ReturnType<Payload['find']>
//   },
//   findByID: (...args) => {
//     const onChange = args.pop() as OnChange<ReturnType<Payload['findByID']>>
//     const originalArgs = args as Parameters<Payload['findByID']>
//     // return payload.findByID(...originalArgs)
//     return {} as ReturnType<Payload['findByID']>
//   },
// }

// // usePayloadQuery
