import type { SanitizedConfig } from 'payload/config'

import path from 'path'

export const webpack = (config) => {
  const aliasPath = path.resolve(__dirname, '../mock.js')

  return {
    ...config,
    resolve: {
      ...(config.resolve || {}),
      alias: {
        ...(config.resolve?.alias || {}),
        '@payloadcms/db-postgres': aliasPath,
      },
    },
  }
}

export const extendWebpackConfig = (config: SanitizedConfig) => {
  const existingWebpackConfig = config.admin.webpack
    ? config.admin.webpack
    : (webpackConfig) => webpackConfig

  config.admin.webpack = (webpackConfig) => {
    return webpack(existingWebpackConfig(webpackConfig))
  }
}
