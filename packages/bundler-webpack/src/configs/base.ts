import type { SanitizedConfig } from 'payload/config'
import type { Configuration } from 'webpack'

import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
import webpack from 'webpack'

const mockModulePath = path.resolve(__dirname, '../mocks/emptyModule.js')
const mockDotENVPath = path.resolve(__dirname, '../mocks/dotENV.js')

const nodeModulesPath = path.resolve(__dirname, '../../../../')
const adminFolderPath = path.resolve(nodeModulesPath, 'payload/dist/admin')
const bundlerPath = path.resolve(__dirname, '../')

export const getBaseConfig = (payloadConfig: SanitizedConfig): Configuration => ({
  entry: {
    main: [adminFolderPath],
  },
  module: {
    rules: [
      {
        exclude: /\/node_modules\/(?!.+\.tsx?$).*$/,
        test: /\.(t|j)sx?$/,
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
  plugins: [
    new webpack.ProvidePlugin({ process: require.resolve('process/browser') }),
    new webpack.DefinePlugin(
      Object.entries(process.env).reduce((values, [key, val]) => {
        if (key.indexOf('PAYLOAD_PUBLIC_') === 0) {
          return {
            ...values,
            [`process.env.${key}`]: `'${val}'`,
          }
        }

        return values
      }, {}),
    ),
    new HtmlWebpackPlugin({
      filename: path.normalize('./index.html'),
      template: payloadConfig.admin.indexHTML,
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  resolve: {
    alias: {
      '@payloadcms/bundler-webpack': mockModulePath,
      [bundlerPath]: mockModulePath,
      dotenv: mockDotENVPath,
      path: require.resolve('path-browserify'),
      payload$: mockModulePath,
      'payload-config': payloadConfig.paths.rawConfig,
      'payload-user-css': payloadConfig.admin.css,
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
    fallback: {
      crypto: false,
      http: false,
      https: false,
    },
  },
})
