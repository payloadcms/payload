import { Configuration, WebpackPluginInstance } from 'webpack';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { SwcMinifyWebpackPlugin } from 'swc-minify-webpack-plugin';
import { getBaseConfig } from './base';
import { SanitizedConfig } from '../../../config/types';

export const getProdConfig = (payloadConfig: SanitizedConfig): Configuration => {
  const baseConfig = getBaseConfig(payloadConfig) as any;

  let webpackConfig: Configuration = {
    ...baseConfig,
    output: {
      publicPath: `${payloadConfig.routes.admin}/`,
      path: payloadConfig.admin.buildPath,
      filename: '[name].[chunkhash].js',
      chunkFilename: '[name].[chunkhash].js',
    },
    mode: 'production',
    stats: 'errors-only',
    optimization: {
      minimizer: [new SwcMinifyWebpackPlugin()],
      splitChunks: {
        cacheGroups: {
          styles: {
            name: 'styles',
            test: /\.(sa|sc|c)ss$/,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    },
    plugins: [
      ...baseConfig.plugins,
      new MiniCSSExtractPlugin({
        filename: '[name].[contenthash].css',
        ignoreOrder: true,
      }),
    ],
  };

  webpackConfig.module.rules.push({
    test: /\.(scss|css)$/,
    sideEffects: true,
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
