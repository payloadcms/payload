import type { Configuration as WebpackConfig } from 'webpack'
import path from 'path'

export const extendWebpackConfig = (existingWebpackConfig: WebpackConfig): WebpackConfig => {
  const newConfig: WebpackConfig = {
    ...existingWebpackConfig,
    resolve: {
      ...(existingWebpackConfig.resolve || {}),
      alias: {
        ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
        '@aws-sdk/client-s3': path.resolve(__dirname, './mock.js'),
        '@aws-sdk/lib-storage': path.resolve(__dirname, './mock.js'),
        fs: path.resolve(__dirname, './fileStub.js'),
      },
    },
  }

  return newConfig
}
