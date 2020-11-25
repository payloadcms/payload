import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserJSPlugin from 'terser-webpack-plugin';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import path from 'path';
import webpack, { Configuration } from 'webpack';
import { Config } from '../config/types';
import babelConfig from '../babel.config';

const mockModulePath = path.resolve(__dirname, './mocks/emptyModule.js');

export default (config: Config): Configuration => {
  let webpackConfig: Configuration = {
    entry: {
      main: [path.resolve(__dirname, '../admin')],
    },
    output: {
      path: path.resolve(process.cwd(), 'build'),
      publicPath: `${config.routes.admin}/`,
      filename: '[name].[chunkhash].js',
      chunkFilename: '[name].[chunkhash].js',
    },
    mode: 'production',
    devtool: 'source-map',
    stats: 'errors-only',
    optimization: {
      minimizer: [new TerserJSPlugin({}), new CssMinimizerPlugin()],
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
    resolveLoader: { modules: ['node_modules', path.join(__dirname, '../../node_modules')] },
    module: {
      rules: [
        {
          test: /\.(t|j|)sx?$/,
          exclude: /node_modules[\\/](?!(@payloadcms[\\/]payload)[\\/]).*/,
          use: {
            loader: require.resolve('babel-loader'),
            options: babelConfig({ env: () => false }),
          },
        },

        {
          test: /\.(sa|sc|c)ss$/,
          sideEffects: true,
          use: [
            MiniCSSExtractPlugin.loader,
            require.resolve('css-loader'),
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
        {
          oneOf: [
            {
              test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
              type: 'asset/resource',
            },
            {
              test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
              type: 'asset/inline',
            },
          ],
        },
      ],
    },
    resolve: {
      fallback: {
        path: require.resolve('path-browserify'),
        crypto: false,
        https: false,
        http: false,
      },
      modules: ['node_modules', path.resolve(__dirname, '../../node_modules')],
      alias: {
        'payload/config': config.paths.config,
        '@payloadcms/payload$': mockModulePath,
      },
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
    plugins: [
      new webpack.ProvidePlugin(
        { process: 'process/browser' },
      ),
      new HtmlWebpackPlugin({
        template: config.admin && config.admin.indexHTML
          ? path.join(config.paths.configDir, config.admin.indexHTML)
          : path.resolve(__dirname, '../admin/index.html'),
        filename: path.normalize('./index.html'),
      }),
      new webpack.DefinePlugin(Object.entries(config.publicENV).reduce((values, [key, val]) => ({
        ...values,
        [`process.env.${key}`]: `'${val}'`,
      }), {})),
      new MiniCSSExtractPlugin({
        filename: '[name].css',
        ignoreOrder: true,
      }),
    ],
  };

  if (Array.isArray(config.serverModules)) {
    config.serverModules.forEach((mod) => {
      webpackConfig.resolve.alias[mod] = mockModulePath;
    });
  }

  if (process.env.PAYLOAD_ANALYZE_BUNDLE) {
    webpackConfig.plugins.push(new BundleAnalyzerPlugin());
  }

  if (config.paths.scss) {
    webpackConfig.resolve.alias['payload-scss-overrides'] = path.join(config.paths.configDir, config.paths.scss);
  } else {
    webpackConfig.resolve.alias['payload-scss-overrides'] = path.resolve(__dirname, '../admin/scss/overrides.scss');
  }

  if (config.webpack && typeof config.webpack === 'function') {
    webpackConfig = config.webpack(webpackConfig);
  }

  return webpackConfig;
};
