import type { Config } from 'payload/config'
import path from 'path'
import type { Configuration as WebpackConfig } from 'webpack'

const mockModulePath = path.resolve(__dirname, 'mocks/serverModule.js');

export const extendWebpackConfig = (config: Config): ((webpackConfig: WebpackConfig) => WebpackConfig) =>
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
          "stripe": mockModulePath,
          // "fs": mockModulePath,
          // "stream": mockModulePath,
          // "url": mockModulePath,
          // "util": mockModulePath,
          // "querystring": mockModulePath,
          // "net": mockModulePath,
          // "zlib": mockModulePath,
          // "async_hooks": mockModulePath,
          // [path.resolve(__dirname, './index')]: mockModulePath,
          [path.resolve(__dirname, './routes/rest')]: mockModulePath,
          [path.resolve(__dirname, './routes/webhooks')]: mockModulePath,
        },
      },
    }
  }
