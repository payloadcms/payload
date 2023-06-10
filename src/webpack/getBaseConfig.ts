import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { Configuration } from 'webpack';
import { SanitizedConfig } from '../config/types';

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
        exclude: /node_modules/,
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
    modules: ['node_modules', path.resolve(__dirname, '../../node_modules')],
    alias: {
      'payload-config': config.paths.rawConfig,
      payload$: mockModulePath,
      'payload-user-css': config.admin.css,
      dotenv: mockDotENVPath,
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
      template: config.admin.indexHTML,
      filename: path.normalize('./index.html'),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
});
