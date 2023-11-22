import type { Configuration as WebpackConfig } from 'webpack'

import path from 'path'

export const extendWebpackConfig = (existingWebpackConfig: WebpackConfig): WebpackConfig => {
  const newConfig: WebpackConfig = {
    ...existingWebpackConfig,
    resolve: {
      ...(existingWebpackConfig.resolve || {}),
      alias: {
        ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
        '@payloadcms/plugin-cloud-storage/s3': path.resolve(__dirname, './mock.js'),
        [path.resolve(__dirname, '../../../s3.js')]: path.resolve(__dirname, './mock.js'),
      },
      fallback: {
        ...(existingWebpackConfig.resolve?.fallback ? existingWebpackConfig.resolve.fallback : {}),
        stream: false,
      },
    },
  }

  return newConfig
}
