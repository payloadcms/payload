/* eslint-disable no-console */
import type { Config } from 'payload/config'

import { captureException } from './captureException'
import { startSentry } from './startSentry'
import type { PluginOptions } from './types'
import { extendWebpackConfig } from './webpack'

export const sentry =
  (pluginOptions: PluginOptions) =>
  (incomingConfig: Config): Config => {
    /**
     * If we return early, nothing will be aliased in webpack.
     * See ideal pattern here: https://github.com/payloadcms/plugin-cloud/blob/feat/custom-email-domains/src/plugin.ts#L12
     *
     * Also, we should add an `enabled` option to the plugin options, so that users can enable/disable conditionally without having webpack issues.
     * Example here: https://github.com/payloadcms/plugin-cloud-storage/blob/master/src/plugin.ts#LL31C29-L31C29
     */

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
