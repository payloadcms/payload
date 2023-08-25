import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { Configuration } from 'webpack';
import type { SanitizedConfig } from '../../../config/types';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

const mockModulePath = path.resolve(_dirname, '../../mocks/emptyModule.js');
const mockDotENVPath = path.resolve(_dirname, '../../mocks/dotENV.js');

const nodeModulesPath = path.resolve(_dirname, '../../../../node_modules');
const adminFolderPath = path.resolve(_dirname, '../../../admin');
const bundlerPath = path.resolve(_dirname, '../bundler');

const require = createRequire(import.meta.url);


export const getBaseConfig = (payloadConfig: SanitizedConfig): Configuration => ({
  entry: {
    main: [
      adminFolderPath,
    ],
  },
  resolveLoader: {
    modules: ['node_modules', path.join(_dirname, nodeModulesPath)],
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: /\/node_modules\/(?!.+\.tsx?$).*$/,
        use: [
          {
            loader: require.resolve('swc-loader'),
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
              },
            },
          },
        ],
      },
      {
        oneOf: [
          {
            test: /\.(?:ico|gif|png|jpg|jpeg|woff(2)?|eot|ttf|otf|svg)$/i,
            type: 'asset/resource',
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
    modules: ['node_modules', path.resolve(_dirname, nodeModulesPath)],
    alias: {
      'payload-config': payloadConfig.paths.rawConfig,
      payload$: mockModulePath,
      'payload-user-css': payloadConfig.admin.css,
      dotenv: mockDotENVPath,
      [bundlerPath]: mockModulePath,
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  plugins: [
    new webpack.ProvidePlugin(
      { process: require.resolve('process/browser') },
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
      template: payloadConfig.admin.indexHTML,
      filename: path.normalize('./index.html'),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
});
