import path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack, { Configuration } from 'webpack'
import type { SanitizedConfig } from 'payload/config'

const mockModulePath = path.resolve(__dirname, '../mocks/emptyModule.js')
const mockDotENVPath = path.resolve(__dirname, '../mocks/dotENV.js')

const nodeModulesPath = path.resolve(__dirname, '../../node_modules')
const adminFolderPath = path.resolve(nodeModulesPath, 'payload/dist/admin')
const bundlerPath = path.resolve(__dirname, '../')

export const getBaseConfig = (payloadConfig: SanitizedConfig): Configuration => ({
  entry: {
    main: [adminFolderPath],
  },
  resolveLoader: {
    modules: ['node_modules', nodeModulesPath],
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
      crypto: false,
      https: false,
      http: false,
    },
    modules: ['node_modules', path.resolve(__dirname, nodeModulesPath)],
    alias: {
      path: require.resolve('path-browserify'),
      'payload-config': payloadConfig.paths.rawConfig,
      payload$: mockModulePath,
      'payload-user-css': payloadConfig.admin.css,
      dotenv: mockDotENVPath,
      [bundlerPath]: mockModulePath,
    },
    extensions: ['.ts', '.tsx', '.js', '.json'],
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
      template: payloadConfig.admin.indexHTML,
      filename: path.normalize('./index.html'),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
})
