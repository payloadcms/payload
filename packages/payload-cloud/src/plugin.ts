import type { Config, Payload } from 'payload'

import type { PluginOptions } from './types.js'

import { payloadCloudEmail } from './email.js'
import { getAfterDeleteHook } from './hooks/afterDelete.js'
import { getBeforeChangeHook } from './hooks/beforeChange.js'
import {
  getCacheUploadsAfterChangeHook,
  getCacheUploadsAfterDeleteHook,
} from './hooks/uploadCache.js'
import { getStaticHandler } from './staticHandler.js'

export const generateRandomString = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export const payloadCloudPlugin =
  (pluginOptions?: PluginOptions) =>
  async (incomingConfig: Config): Promise<Config> => {
    let config = { ...incomingConfig }

    if (process.env.PAYLOAD_CLOUD !== 'true') {
      return config
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
                    debug: pluginOptions?.debug,
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
      config.email = await payloadCloudEmail({
        apiKey,
        config,
        defaultDomain,
        defaultFromAddress: pluginOptions?.email?.defaultFromAddress,
        defaultFromName: pluginOptions?.email?.defaultFromName,
        skipVerify: pluginOptions?.email?.skipVerify,
      })
    }

    // We make sure to only run cronjobs on one instance using a instance identifier stored in a global.

    const DEFAULT_CRON = '* * * * *'
    const DEFAULT_LIMIT = 10
    const DEFAULT_CRON_JOB = {
      cron: DEFAULT_CRON,
      limit: DEFAULT_LIMIT,
      queue: 'default',
    }

    config.globals = [
      ...(config.globals || []),
      {
        slug: 'payload-cloud-instance',
        admin: {
          hidden: true,
        },
        fields: [
          {
            name: 'instance',
            type: 'text',
            required: true,
          },
        ],
      },
    ]

    if (pluginOptions?.enableAutoRun === false || !config.jobs) {
      return config
    }

    const oldAutoRunCopy = config.jobs.autoRun ?? []

    const hasExistingAutorun = Boolean(config.jobs.autoRun)

    const newShouldAutoRun = async (payload: Payload) => {
      if (process.env.PAYLOAD_CLOUD_JOBS_INSTANCE) {
        const retrievedGlobal = await payload.findGlobal({
          slug: 'payload-cloud-instance',
        })

        if (retrievedGlobal.instance === process.env.PAYLOAD_CLOUD_JOBS_INSTANCE) {
          return true
        } else {
          process.env.PAYLOAD_CLOUD_JOBS_INSTANCE = ''
        }
      }

      return false
    }

    if (!config.jobs.shouldAutoRun) {
      config.jobs.shouldAutoRun = newShouldAutoRun
    }

    const newAutoRun = async (payload: Payload) => {
      const instance = generateRandomString()

      process.env.PAYLOAD_CLOUD_JOBS_INSTANCE = instance

      await payload.updateGlobal({
        slug: 'payload-cloud-instance',
        data: {
          instance,
        },
      })

      if (!hasExistingAutorun) {
        return [DEFAULT_CRON_JOB]
      }

      return typeof oldAutoRunCopy === 'function' ? await oldAutoRunCopy(payload) : oldAutoRunCopy
    }

    config.jobs.autoRun = newAutoRun

    return config
  }
