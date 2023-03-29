import type { Config } from 'payload/config'
import path from 'path'
import type { Configuration as WebpackConfig } from 'webpack'

export const extendWebpackConfig =
  (config: Config): ((webpackConfig: WebpackConfig) => WebpackConfig) =>
  webpackConfig => {
    const existingWebpackConfig =
      typeof config.admin?.webpack === 'function'
        ? config.admin.webpack(webpackConfig)
        : webpackConfig

    return {
      ...existingWebpackConfig,
      resolve: {
        ...(existingWebpackConfig.resolve || {}),
        alias: {
          ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
          fs: path.resolve(__dirname, './mocks/fileStub.js'),
          '@aws-sdk/client-s3': path.resolve(__dirname, './mocks/s3.js'),
          '@aws-sdk/lib-storage': path.resolve(__dirname, './mocks/s3.js'),
          [path.resolve(__dirname, './email')]: path.resolve(__dirname, './mocks/email.js'),
          [path.resolve(__dirname, './utilities/getStorageClient')]: path.resolve(
            __dirname,
            './mocks/storageClient.js',
          ),
        },
      },
    }
  }
