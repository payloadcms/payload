import type { Config } from 'payload/config'
import { extendWebpackConfig } from './webpack'
import { getBeforeChangeHook } from './hooks/beforeChange'
import { getAfterDeleteHook } from './hooks/afterDelete'
import { getStaticHandler } from './staticHandler'
import { payloadCloudEmail } from './email'
import type { PluginOptions } from './types'
import { getCacheUploadsAfterChangeHook, getCacheUploadsAfterDeleteHook } from './hooks/uploadCache'

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
        upload: {
          ...(config.upload || {}),
          useTempFiles: true,
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
                  getStaticHandler({
                    collection,
                    cachingOptions: pluginOptions?.uploadCaching,
                  }),
                ],
                disableLocalStorage: true,
              },
              hooks: {
                ...(collection.hooks || {}),
                beforeChange: [
                  ...(collection.hooks?.beforeChange || []),
                  getBeforeChangeHook({ collection }),
                ],
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
              },
            }
          }

          return collection
        }),
      }
    }

    // Configure cloud email
    const apiKey = process.env.PAYLOAD_CLOUD_EMAIL_API_KEY
    const defaultDomain = process.env.PAYLOAD_CLOUD_DEFAULT_DOMAIN
    if (pluginOptions?.email !== false && apiKey && defaultDomain) {
      config.email = payloadCloudEmail({
        config,
        apiKey,
        defaultDomain,
      })
    }

    return config
  }
