import type { Config } from 'payload'

import type { PluginOptions } from './types.js'

import { captureException } from './captureException.js'
import { startSentry } from './startSentry.js'

export const sentryPlugin =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    if (pluginOptions.enabled === false || !pluginOptions.dsn) {
      return config
    }

    config.hooks = {
      ...(incomingConfig.hooks || {}),

      afterError: [
        ({ error }) => {
          captureException(error)
        },
      ],
    }

    config.onInit = async (payload) => {
      if (incomingConfig.onInit) {
        await incomingConfig.onInit(payload)
      }
      startSentry(pluginOptions, payload)
    }

    return config
  }
