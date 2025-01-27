import type { SanitizedConfig } from 'payload/config'
import type { Configuration } from 'webpack'

import findNodeModules from 'find-node-modules'
import fs from 'fs'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import path from 'path'
import webpack from 'webpack'

const mockModulePath = path.resolve(__dirname, '../mocks/emptyModule.js')
const mockDotENVPath = path.resolve(__dirname, '../mocks/dotENV.js')
const mockDBAdapterPath = path.resolve(__dirname, '../mocks/db-adapters.js')

const nodeModulesPaths = findNodeModules({ cwd: process.cwd(), relative: false })

export const getBaseConfig = (payloadConfig: SanitizedConfig): Configuration => {
  let nodeModulesPath = nodeModulesPaths.find((p) => {
    const guess = path.resolve(p, 'payload/dist/admin')
    if (fs.existsSync(guess)) {
      return true
    }
    return false
  })

  if (!nodeModulesPath) {
    nodeModulesPath = process.cwd()
  }

  const adminFolderPath = path.resolve(nodeModulesPath, 'payload/dist/admin')

  const config: Configuration = {
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
    ],
    resolve: {
      alias: {
        '@payloadcms/bundler-webpack': mockModulePath,
        '@payloadcms/db-mongodb': mockDBAdapterPath,
        '@payloadcms/db-postgres': mockDBAdapterPath,
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
      modules: ['node_modules', nodeModulesPath, path.resolve(__dirname, '../../node_modules')],
    },
  }

  return config
}
