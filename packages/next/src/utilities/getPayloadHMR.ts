import type { GeneratedTypes, Payload } from 'payload'
import type { InitOptions } from 'payload/config'

import { BasePayload } from 'payload'
import WebSocket from 'ws'

let cached: {
  payload: Payload | null
  promise: Promise<Payload> | null
  reload: Promise<boolean> | boolean
} = global._payload

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._payload = { payload: null, promise: null, reload: false }
}

export const getPayloadHMR = async (options: InitOptions): Promise<Payload> => {
  if (!options?.config) {
    throw new Error('Error: the payload config is required for getPayload to work.')
  }

  if (cached.payload) {
    const config = await options.config // TODO: check if we can move this inside the cached.reload === true condition

    if (cached.reload === true) {
      let resolve

      cached.reload = new Promise((res) => (resolve = res))

      if (typeof cached.payload.db.destroy === 'function') {
        await cached.payload.db.destroy()
      }

      cached.payload.config = config

      cached.payload.collections = config.collections.reduce((collections, collection) => {
        collections[collection.slug] = {
          config: collection,
          customIDType: cached.payload.collections[collection.slug]?.customIDType,
        }
        return collections
      }, {})

      cached.payload.globals = {
        config: config.globals,
      }

      // TODO: support HMR for other props in the future (see payload/src/index init()) hat may change on Payload singleton

      await cached.payload.db.init()
      await cached.payload.db.connect({ hotReload: true })
      resolve()
    }

    if (cached.reload instanceof Promise) {
      await cached.reload
    }

    return cached.payload
  }

  if (!cached.promise) {
    cached.promise = new BasePayload<GeneratedTypes>().init(options)
  }

  try {
    cached.payload = await cached.promise

    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.DISABLE_PAYLOAD_HMR !== 'true'
    ) {
      try {
        const port = process.env.PORT || '3000'
        const ws = new WebSocket(`ws://localhost:${port}/_next/webpack-hmr`)

        ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            const data = JSON.parse(event.data)

            if ('action' in data && data.action === 'serverComponentChanges') {
              cached.reload = true
            }
          }
        }
      } catch (_) {
        // swallow e
      }
    }
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.payload
}
