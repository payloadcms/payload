import type { Config } from 'payload/config'

import type { PluginOptions } from './types'

import { payloadCloudEmail } from './email'
import { getAfterDeleteHook } from './hooks/afterDelete'
import { getBeforeChangeHook } from './hooks/beforeChange'
import { getCacheUploadsAfterChangeHook, getCacheUploadsAfterDeleteHook } from './hooks/uploadCache'
import { getStaticHandler } from './staticHandler'
import { extendWebpackConfig } from './webpack'

export const payloadCloud =
  (pluginOptions?: PluginOptions) =>
  (incomingConfig: Config): Config => {
    let config = { ...incomingConfig }
    const webpack = extendWebpackConfig(incomingConfig)

    config.admin = {
      ...(config.admin || {}),
      webpack,
    }

    if (process.env.PAYLOAD_CLOUD !== 'true') {
      return config // only modified webpack
    }

    const cachingEnabled =
      pluginOptions?.uploadCaching !== false && !!process.env.PAYLOAD_CLOUD_CACHE_KEY

    const apiEndpoint = pluginOptions?.endpoint || 'https://cloud-api.payloadcms.com'

    // Configure cloud storage
    if (pluginOptions?.storage !== false) {
      config = {
        ...config,
        collections: (config.collections || []).map((collection) => {
          if (collection.upload) {
            return {
              ...collection,
              hooks: {
                ...(collection.hooks || {}),
                afterChange: [
                  ...(collection.hooks?.afterChange || []),
                  ...(cachingEnabled
                    ? [getCacheUploadsAfterChangeHook({ endpoint: apiEndpoint })]
                    : []),
                ],
                afterDelete: [
                  ...(collection.hooks?.afterDelete || []),
                  getAfterDeleteHook({ collection }),
                  ...(cachingEnabled
                    ? [getCacheUploadsAfterDeleteHook({ endpoint: apiEndpoint })]
                    : []),
                ],
                beforeChange: [
                  ...(collection.hooks?.beforeChange || []),
                  getBeforeChangeHook({ collection }),
                ],
              },
              upload: {
                ...(typeof collection.upload === 'object' ? collection.upload : {}),
                disableLocalStorage: true,
                handlers: [
                  ...(typeof collection.upload === 'object' &&
                  Array.isArray(collection.upload.handlers)
                    ? collection.upload.handlers
                    : []),
                  getStaticHandler({
                    cachingOptions: pluginOptions?.uploadCaching,
                    collection,
                  }),
                ],
              },
            }
          }

          return collection
        }),
        upload: {
          ...(config.upload || {}),
          useTempFiles: true,
        },
      }
    }

    // Configure cloud email
    const apiKey = process.env.PAYLOAD_CLOUD_EMAIL_API_KEY
    const defaultDomain = process.env.PAYLOAD_CLOUD_DEFAULT_DOMAIN
    if (pluginOptions?.email !== false && apiKey && defaultDomain) {
      config.email = payloadCloudEmail({
        apiKey,
        config,
        defaultDomain,
      })
    }

    return config
  }
