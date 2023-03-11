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
      collections: (config.collections || []).map(existingCollection => {
        if (existingCollection.upload) {
          return {
            ...existingCollection,
            upload: {
              ...(typeof existingCollection.upload === 'object' ? existingCollection.upload : {}),
              handlers: [
                ...(typeof existingCollection.upload === 'object' &&
                Array.isArray(existingCollection.upload.handlers)
                  ? existingCollection.upload.handlers
                  : []),
                getStaticHandler({ collection: existingCollection }),
              ],
              disableLocalStorage: true,
            },
            hooks: {
              ...(existingCollection.hooks || {}),
              beforeChange: [
                ...(existingCollection.hooks?.beforeChange || []),
                getBeforeChangeHook({ collection: existingCollection }),
              ],
              afterDelete: [
                ...(existingCollection.hooks?.afterDelete || []),
                getAfterDeleteHook({ collection: existingCollection }),
              ],
            },
          }
        }

        return existingCollection
      }),
    }
  }
