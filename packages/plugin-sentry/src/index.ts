/* eslint-disable no-console */
import type { Config } from 'payload/config'

import { captureException } from './captureException'
import { startSentry } from './startSentry'
import type { PluginOptions } from './types'
import { extendWebpackConfig } from './webpack'

export const sentry =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    if (!pluginOptions.dsn) {
      console.log('Sentry plugin is disabled because no DSN was provided')
      return incomingConfig
    }

    let config = { ...incomingConfig }
    const webpack = extendWebpackConfig(incomingConfig)

    config.admin = {
      ...(config.admin || {}),
      webpack,
    }

    config.hooks = {
      ...(incomingConfig.hooks || {}),
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
