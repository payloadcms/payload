import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { Configuration } from 'webpack';
import { SanitizedConfig } from '../config/types';
import babelConfig from '../babel.config';

const mockModulePath = path.resolve(__dirname, './mocks/emptyModule.js');
const mockDotENVPath = path.resolve(__dirname, './mocks/dotENV.js');
const mockUtil = path.resolve(__dirname, './mocks/mockUtil.js');
const mockStream = path.resolve(__dirname, './mocks/mockStream.js');
const mockChildProcess = path.resolve(__dirname, './mocks/mockChildProcess.js');
const mockFsConstants = path.resolve(__dirname, './mocks/mockFsConstants.js');
const mockHtmlWebpackPlugin = path.resolve(__dirname, './mocks/mockHtmlWebpackPlugin.js');
const mockOnFinished = path.resolve(__dirname, './mocks/mockOnFinished.js');
const mockMongoDbMemoryServer = path.resolve(__dirname, './mocks/mockMongoDbMemoryServer.js');

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
        exclude: /node_modules[\\/].*/,
        use: [
          {
            loader: require.resolve('babel-loader'),
            options: babelConfig,
          },
        ],
      },
      { test: /\.node$/, use: 'node-loader' },
      {
        test: /\.(png|jpe?g|webp|tiff?)/i,
        use: [
          'file-loader',
          {
            loader: 'webpack-sharp-loader',
            options: {
              processFunction: (sharp) => sharp.negate(),
            },
          },
        ],
      },
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
      crypto: false,
      https: false,
      http: false,
      fs: false,
    },
    modules: ['node_modules', path.resolve(__dirname, '../../node_modules')],
    alias: {
      'payload-config': config.paths.config,
      payload$: mockModulePath,
      'payload-user-css': config.admin.css,
      'payload-scss-overrides': config.admin.scss,
      dotenv: mockDotENVPath,

      util: mockUtil,
      child_process: mockChildProcess,
      stream: mockStream,
      'fs-constants': mockFsConstants,
      'html-webpack-plugin': mockHtmlWebpackPlugin,
      'on-finished': mockOnFinished,
      'mongodb-memory-server-core': mockMongoDbMemoryServer,

      'stream-browserify': mockModulePath,
      'os-browserify': mockModulePath,
      assert: mockModulePath,
      'tty-browserify': mockModulePath,
      'vm-browserify': mockModulePath,
      'browserify-zlib': mockModulePath,
      webpack: mockModulePath,
      net: mockModulePath,
      dns: mockModulePath,
      os: mockModulePath,
      tls: mockModulePath,
      module: mockModulePath,
      tty: mockModulePath,
      '@swc': mockModulePath,
      esbuild: mockModulePath,
      worker_threads: mockModulePath,
      vm: mockModulePath,
      zlib: mockModulePath,
      'process/browser': mockModulePath,

      'mongodb-client-encryption': mockModulePath,
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
