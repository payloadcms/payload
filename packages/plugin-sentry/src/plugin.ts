/* eslint-disable no-console */
import type { Config } from 'payload/config'

import { captureException } from './captureException'
import { startSentry } from './startSentry'
import type { PluginOptions } from './types'
import { extendWebpackConfig } from './webpack'

export const sentry =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    let config = { ...incomingConfig }
    const webpack = extendWebpackConfig(incomingConfig)

    config.admin = {
      ...(config.admin || {}),
      webpack,
    }

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

    startSentry({
      dsn: pluginOptions.dsn,
      options: pluginOptions.options || {},
    })

    return config
  }
