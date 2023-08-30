import type { Configuration, WebpackPluginInstance } from 'webpack'

import MiniCSSExtractPlugin from 'mini-css-extract-plugin'
import { createRequire } from 'node:module'
import path, { dirname } from 'path'
import { SwcMinifyWebpackPlugin } from 'swc-minify-webpack-plugin'
import { fileURLToPath } from 'url'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

import type { SanitizedConfig } from '../../../config/types.js'

import { getBaseConfig } from './base.js'
const __filename = fileURLToPath(import.meta.url)

const require = createRequire(import.meta.url)
const _dirname = dirname(__filename)
const nodeModulesPath = path.resolve(_dirname, '../../../../node_modules')
const rootFolderPath = path.resolve(_dirname, '../../../')
const exportsFolderPath = path.resolve(_dirname, '../../../exports')

export const getProdConfig = (payloadConfig: SanitizedConfig): Configuration => {
  const baseConfig = getBaseConfig(payloadConfig) as any

  let webpackConfig: Configuration = {
    ...baseConfig,
    mode: 'production',
    optimization: {
      minimizer: [new SwcMinifyWebpackPlugin()],
      splitChunks: {
        cacheGroups: {
          styles: {
            chunks: 'all',
            enforce: true,
            name: 'styles',
            test: /\.(sa|sc|c)ss$/,
          },
        },
      },
    },
    output: {
      chunkFilename: '[name].[chunkhash].js',
      filename: '[name].[chunkhash].js',
      path: payloadConfig.admin.buildPath,
      publicPath: `${payloadConfig.routes.admin}/`,
    },
    plugins: [
      ...baseConfig.plugins,
      new MiniCSSExtractPlugin({
        filename: '[name].[contenthash].css',
        ignoreOrder: true,
      }),
    ],
    stats: 'errors-only',
  }

  webpackConfig.module.rules.push({
    sideEffects: true,
    test: /\.(scss|css)$/,
    use: [
      MiniCSSExtractPlugin.loader,
      {
        loader: require.resolve('css-loader'),
        options: {
          url: {
            filter: (url, resourcePath) => !url.startsWith('/'),
          },
        },
      },
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            plugins: [require.resolve('postcss-preset-env')],
          },
        },
      },
      {
        loader: require.resolve('sass-loader'),
        options: {
          sassOptions: {
            includePaths: [exportsFolderPath],
          },
        },
      },
    ],
  })

  if (process.env.PAYLOAD_ANALYZE_BUNDLE) {
    webpackConfig.plugins.push(new BundleAnalyzerPlugin() as unknown as WebpackPluginInstance)
  }

  if (payloadConfig.admin.webpack && typeof payloadConfig.admin.webpack === 'function') {
    webpackConfig = payloadConfig.admin.webpack(webpackConfig)
  }

  return webpackConfig
}
