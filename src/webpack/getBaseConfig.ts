import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { Configuration } from 'webpack';
import { SanitizedConfig } from '../config/types';
import babelConfig from '../babel.config';

const mockModulePath = path.resolve(__dirname, './mocks/emptyModule.js');
const mockDotENVPath = path.resolve(__dirname, './mocks/dotENV.js');

export default (config: SanitizedConfig): Configuration => ({
  entry: {
    main: [
      path.resolve(__dirname, '../admin'),
    ],
  },
  resolveLoader: {
    modules: ['node_modules', path.join(__dirname, '../../node_modules')],
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: /node_modules[\\/](?!(@payloadcms[\\/]payload)[\\/]).*/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: babelConfig,
          },
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
      assert: require.resolve('assert'),
      crypto: false,
      https: false,
      http: false,
    },
    modules: ['node_modules', path.resolve(__dirname, '../../node_modules')],
    alias: {
      'payload-config': config.paths.config,
      payload$: mockModulePath,
      'payload-user-css': config.admin.css,
      'payload-scss-overrides': config.admin.scss,
      dotenv: mockDotENVPath,
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  plugins: [
    new webpack.ProvidePlugin(
      { process: 'process/browser' },
    ),
    new webpack.DefinePlugin(
      Object.entries(process.env).reduce(
        (values, [key, val]) => {
          if (key.indexOf('PAYLOAD_PUBLIC_') === 0) {
            return ({
              ...values,
              [`process.env.${key}`]: `'${val}'`,
            });
          }

          return values;
        },
        {},
      ),
    ),
    new HtmlWebpackPlugin({
      template: config.admin.indexHTML,
      filename: path.normalize('./index.html'),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
});
