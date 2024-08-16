import type { InitOptions, Payload, SanitizedConfig } from 'payload'

import { BasePayload, generateImportMap } from 'payload'
import WebSocket from 'ws'

let cached: {
  payload: Payload | null
  promise: Promise<Payload> | null
  reload: Promise<void> | boolean
  ws: WebSocket | null
} = global._payload

if (!cached) {
  cached = global._payload = { payload: null, promise: null, reload: false, ws: null }
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

  // Generate component map
  if (config.admin?.importMap?.autoGenerate !== false) {
    await generateImportMap(config, {
      log: true,
    })
  }

  await payload.db.init()
  if (payload.db.connect) {
    await payload.db.connect({ hotReload: true })
  }
}

export const getPayloadHMR = async (options: InitOptions): Promise<Payload> => {
  if (!options?.config) {
    throw new Error('Error: the payload config is required for getPayloadHMR to work.')
  }

  if (cached.payload) {
    if (cached.reload === true) {
      let resolve: () => void

      // getPayloadHMR is called multiple times, in parallel. However, we only want to run `await reload` once. By immediately setting cached.reload to a promise,
      // we can ensure that all subsequent calls will wait for the first reload to finish. So if we set it here, the 2nd call of getPayloadHMR
      // will reach `if (cached.reload instanceof Promise) {` which then waits for the first reload to finish.
      cached.reload = new Promise((res) => (resolve = res))
      const config = await options.config
      await reload(config, cached.payload)

      resolve()
    }

    if (cached.reload instanceof Promise) {
      await cached.reload
    }

    if (options?.importMap) {
      cached.payload.importMap = options.importMap
    }
    return cached.payload
  }

  if (!cached.promise) {
    // no need to await options.config here, as it's already awaited in the BasePayload.init
    cached.promise = new BasePayload().init(options)
  }

  try {
    cached.payload = await cached.promise

    if (
      !cached.ws &&
      process.env.NODE_ENV !== 'production' &&
      process.env.NODE_ENV !== 'test' &&
      process.env.DISABLE_PAYLOAD_HMR !== 'true'
    ) {
      try {
        const port = process.env.PORT || '3000'
        cached.ws = new WebSocket(
          `ws://localhost:${port}${process.env.NEXT_BASE_PATH ?? ''}/_next/webpack-hmr`,
        )

        cached.ws.onmessage = (event) => {
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

  if (options?.importMap) {
    cached.payload.importMap = options.importMap
  }

  return cached.payload
}
