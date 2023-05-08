import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { Configuration, WebpackPluginInstance } from 'webpack';
import { SwcMinifyWebpackPlugin } from 'swc-minify-webpack-plugin';
import { SanitizedConfig } from '../config/types';
import getBaseConfig from './getBaseConfig';

export default (payloadConfig: SanitizedConfig): Configuration => {
  const baseConfig = getBaseConfig(payloadConfig) as any;

  let config: Configuration = {
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
        filename: '[name].css',
        ignoreOrder: true,
      }),
    ],
  };

  config.module.rules.push({
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
    config.plugins.push(new BundleAnalyzerPlugin() as unknown as WebpackPluginInstance);
  }

  if (payloadConfig.admin.webpack && typeof payloadConfig.admin.webpack === 'function') {
    config = payloadConfig.admin.webpack(config);
  }

  return config;
};
