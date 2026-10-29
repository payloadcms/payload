import type { Plugin } from 'payload'

import { definePlugin } from 'payload'

import type { CloudflarePluginOptions } from './types.js'

import { createCloudflareLogger } from './logger.js'

export type { CloudflarePluginOptions } from './types.js'

export const cloudflarePlugin = definePlugin<CloudflarePluginOptions | undefined>({
  slug: '@payloadcms/plugin-cloudflare',
  // Apply defaults to upload collections added by other plugins as well.
  order: 100,
  plugin: ({ config, options = {} }) => {
    if (options.enabled === false) {
      return config
    }

    return {
      ...config,
      auth: {
        ...config.auth,
        passwordHashIterations: config.auth?.passwordHashIterations ?? 100000,
      },
      collections: config.collections?.map((collection) => {
        if (!collection.upload) {
          return collection
        }

        const upload = typeof collection.upload === 'object' ? collection.upload : {}

        return {
          ...collection,
          upload: {
            ...upload,
            crop: upload.crop ?? false,
            focalPoint: upload.focalPoint ?? false,
            ...(options.useNativeFetch ? { skipSafeFetch: upload.skipSafeFetch ?? true } : {}),
          },
        }
      }),
      logger:
        config.logger ??
        (options.useConsoleLogger === false
          ? undefined
          : createCloudflareLogger({
              enabled: process.env.DISABLE_LOGGING !== 'true',
              level: process.env.PAYLOAD_LOG_LEVEL ?? 'info',
            })),
    }
  },
}) satisfies (options?: CloudflarePluginOptions) => Plugin
