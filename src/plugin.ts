import type { Config } from 'payload/config'
import { extendWebpackConfig } from './webpack'
import { getBeforeChangeHook } from './hooks/beforeChange'
import { getAfterDeleteHook } from './hooks/afterDelete'
import { getStaticHandler } from './staticHandler'

export const payloadCloud =
  (/** Possible args in the future */) =>
  (config: Config): Config => {
    const webpack = extendWebpackConfig(config)

    if (process.env.PAYLOAD_CLOUD !== 'true') {
      return {
        ...config,
        admin: {
          ...(config.admin || {}),
          webpack,
        },
      }
    }

    return {
      ...config,
      upload: {
        ...(config.upload || {}),
        useTempFiles: true,
      },
      admin: {
        ...(config.admin || {}),
        webpack,
      },
      collections: (config.collections || []).map(collection => {
        if (collection.upload) {
          return {
            ...collection,
            upload: {
              ...(typeof collection.upload === 'object' ? collection.upload : {}),
              handlers: [
                ...(typeof collection.upload === 'object' &&
                Array.isArray(collection.upload.handlers)
                  ? collection.upload.handlers
                  : []),
                getStaticHandler({ collection }),
              ],
              disableLocalStorage: true,
            },
            hooks: {
              ...(collection.hooks || {}),
              beforeChange: [
                ...(collection.hooks?.beforeChange || []),
                getBeforeChangeHook({ collection }),
              ],
              afterDelete: [
                ...(collection.hooks?.afterDelete || []),
                getAfterDeleteHook({ collection }),
              ],
            },
          }
        }

        return collection
      }),
    }
  }
