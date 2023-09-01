import type { Configuration, WebpackPluginInstance } from 'webpack';

import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import { SwcMinifyWebpackPlugin } from 'swc-minify-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import type { SanitizedConfig } from '../../../config/types';

import { getBaseConfig } from './base';

export const getProdConfig = (payloadConfig: SanitizedConfig): Configuration => {
  const baseConfig = getBaseConfig(payloadConfig) as any;

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
  };

  webpackConfig.module.rules.push({
    sideEffects: true,
    test: /\.(scss|css)$/,
    use: [
      MiniCSSExtractPlugin.loader,
      {
        loader: require.resolve('css-loader'),
        options: {
          url: (url) => (!url.startsWith('/')),
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
  });

  if (process.env.PAYLOAD_ANALYZE_BUNDLE) {
    webpackConfig.plugins.push(new BundleAnalyzerPlugin() as unknown as WebpackPluginInstance);
  }

  if (payloadConfig.admin.webpack && typeof payloadConfig.admin.webpack === 'function') {
    webpackConfig = payloadConfig.admin.webpack(webpackConfig);
  }

  return webpackConfig;
};
