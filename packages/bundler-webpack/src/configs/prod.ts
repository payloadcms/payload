import type { SanitizedConfig } from 'payload/config'
import type { Configuration } from 'webpack'

import MiniCSSExtractPlugin from 'mini-css-extract-plugin'
import { SwcMinifyWebpackPlugin } from 'swc-minify-webpack-plugin'
import { WebpackPluginInstance } from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

import { getBaseConfig } from './base'

export const getProdConfig = (payloadConfig: SanitizedConfig): Configuration => {
  const baseConfig = getBaseConfig(payloadConfig) as any

  let webpackConfig: Configuration = {
    ...baseConfig,
    mode: 'production',
    module: {
      ...baseConfig.module,
      rules: [
        ...baseConfig.module.rules,
        {
          sideEffects: true,
          test: /\.(scss|css)$/,
          use: [
            MiniCSSExtractPlugin.loader,
            {
              loader: require.resolve('css-loader'),
              options: {
                url: (url) => !url.startsWith('/'),
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
            require.resolve('sass-loader'),
          ],
        },
      ],
    },
    optimization: {
      minimizer: [new SwcMinifyWebpackPlugin()],
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            chunks: 'all',
            enforce: true,
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
      ...(process.env.PAYLOAD_ANALYZE_BUNDLE ? [new BundleAnalyzerPlugin()] : []),
    ],
    stats: 'errors-only',
  }

  if (payloadConfig.admin.webpack && typeof payloadConfig.admin.webpack === 'function') {
    webpackConfig = payloadConfig.admin.webpack(webpackConfig)
  }

  return webpackConfig
}
