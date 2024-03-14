/* eslint-disable no-console */
import type { Config } from 'payload/config'

import type { PluginOptions } from './types.js'

import { captureException } from './captureException.js'
import { startSentry } from './startSentry.js'

export const sentry =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    const config = { ...incomingConfig }

    if (pluginOptions.enabled === false || !pluginOptions.dsn) {
      return config
    }

    config.hooks = {
      ...(incomingConfig.hooks || {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterError: (err: any) => {
        captureException(err)
      },
    }

    config.onInit = async (payload) => {
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      startSentry(pluginOptions, payload)
    }

    return config
  }
