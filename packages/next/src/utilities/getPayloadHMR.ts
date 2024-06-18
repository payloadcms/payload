import type { GeneratedTypes, InitOptions, Payload, SanitizedConfig } from 'payload'

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

export const reload = async (config: SanitizedConfig, payload: Payload): Promise<void> => {
  if (typeof payload.db.destroy === 'function') {
    await payload.db.destroy()
  }

  payload.config = config

  payload.collections = config.collections.reduce((collections, collection) => {
    collections[collection.slug] = {
      config: collection,
      customIDType: payload.collections[collection.slug]?.customIDType,
    }
    return collections
  }, {})

  payload.globals = {
    config: config.globals,
  }

  // TODO: support HMR for other props in the future (see payload/src/index init()) hat may change on Payload singleton

  // Generate types
  if (config.typescript.autoGenerate !== false) {
    // We cannot run it directly here, as generate-types imports json-schema-to-typescript, which breaks on turbopack.
    // see: https://github.com/vercel/next.js/issues/66723
    void payload.bin({
      args: ['generate:types'],
      log: false,
    })
  }

  await payload.db.init()
  if (payload.db.connect) {
    await payload.db.connect({ hotReload: true })
  }
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

      await reload(config, cached.payload)

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
        const ws = new WebSocket(
          `ws://localhost:${port}${process.env.NEXT_BASE_PATH ?? ''}/_next/webpack-hmr`,
        )

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
