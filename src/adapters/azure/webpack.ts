import type { Configuration as WebpackConfig } from 'webpack'
import path from 'path'

export const extendWebpackConfig = (existingWebpackConfig: WebpackConfig): WebpackConfig => {
  const newConfig: WebpackConfig = {
    ...existingWebpackConfig,
    resolve: {
      ...(existingWebpackConfig.resolve || {}),
      alias: {
        ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
        stream: path.resolve(__dirname, './mock.js'),
        '@azure/storage-blob': path.resolve(__dirname, './mock.js'),
        '@azure/abort-controller': path.resolve(__dirname, './mock.js'),
        fs: path.resolve(__dirname, './fileStub.js'),
      },
    },
  }

  return newConfig
}
