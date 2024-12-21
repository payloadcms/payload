import type { Config } from 'payload'

import { Cron } from 'croner'

import type { PluginOptions } from './types.js'

import { payloadCloudEmail } from './email.js'
import { getAfterDeleteHook } from './hooks/afterDelete.js'
import { getBeforeChangeHook } from './hooks/beforeChange.js'
import {
  getCacheUploadsAfterChangeHook,
  getCacheUploadsAfterDeleteHook,
} from './hooks/uploadCache.js'
import { getStaticHandler } from './staticHandler.js'

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

    // We set up cron jobs on init.
    // We also make sure to only run on one instance using a instance identifier stored in a global.

    // If you modify this defaults, make sure to update the TsDoc in the types file.
    const DEFAULT_CRON = '* * * * *'
    const DEFAULT_LIMIT = 10
    const DEFAULT_CRON_JOB = {
      cron: DEFAULT_CRON,
      limit: DEFAULT_LIMIT,
      queue: 'default (every minute)',
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
    const newOnInit = async (payload) => {
      if (config.onInit) {
        await config.onInit(payload)
      }
      const instance = generateRandomString()

      await payload.updateGlobal({
        slug: 'payload-cloud-instance',
        data: {
          instance,
        },
      })

      const cloudInstance = await payload.findGlobal({
        slug: 'payload-cloud-instance',
      })

      const cronJobs = pluginOptions?.cronJobs?.run ?? [DEFAULT_CRON_JOB]
      if (cloudInstance.instance === instance) {
        cronJobs.forEach((cronConfig) => {
          new Cron(cronConfig.cron ?? DEFAULT_CRON, async () => {
            await payload.jobs.run({
              limit: cronConfig.limit ?? DEFAULT_LIMIT,
              queue: cronConfig.queue,
            })
          })
        })
      }
    }

    config.onInit = newOnInit

    return config
  }

function generateRandomString(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
