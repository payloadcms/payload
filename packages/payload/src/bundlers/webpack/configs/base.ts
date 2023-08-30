import type { Configuration } from 'webpack'

import { existsSync } from 'fs'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { createRequire } from 'node:module'
import path, { dirname, join, parse, resolve } from 'path'
import { fileURLToPath } from 'url'
import webpack from 'webpack'

import type { SanitizedConfig } from '../../../config/types.js'

const __filename = fileURLToPath(import.meta.url)
const _dirname = dirname(__filename)

const mockModulePath = path.resolve(_dirname, '../../mocks/emptyModule.js')
const mockDotENVPath = path.resolve(_dirname, '../../mocks/dotENV.js')

const nodeModulesPath = path.resolve(_dirname, '../../../../node_modules')
const adminFolderPath = path.resolve(_dirname, '../../../admin')
const bundlerPath = path.resolve(_dirname, '../bundler.ts')
const bundlerPath2 = path.resolve(_dirname, '../bundler.js')

const require = createRequire(import.meta.url)

export const getBaseConfig = (payloadConfig: SanitizedConfig): Configuration => ({
  entry: {
    main: [adminFolderPath],
  },
  module: {
    rules: [
      {
        exclude: /\/node_modules\/(?!.+\.tsx?$).*$/,
        resolve: {
          fullySpecified: false,
        },
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
                target: 'esnext',
              },
              module: {
                type: 'es6',
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    // This fixes esm: https://github.com/vercel/next.js/issues/41961#issuecomment-1311091390
    new webpack.NormalModuleReplacementPlugin(
      /\.js$/,
      (
        /** @type {{ context: string, request: string }} */
        resource,
      ) => {
        // Skip a non relative import (e.g. a bare import specifier).
        if (resource.request.startsWith('.')) {
          const path = resolve(resource.context, resource.request)

          if (
            // Skip the relative import if it reaches into `node_modules`.
            !path.includes('node_modules') &&
            !existsSync(path)
          ) {
            const { dir, name } = parse(path)
            const extensionlessPath = join(dir, name)

            for (const fallbackExtension of ['.tsx', '.ts', '.js']) {
              if (existsSync(extensionlessPath + fallbackExtension)) {
                resource.request = resource.request.replace(/\.js$/, fallbackExtension)
                break
              }
            }
          }
        }
      },
    ),
  ],
  resolve: {
    alias: {
      [bundlerPath]: mockModulePath,
      [bundlerPath2]: mockModulePath,
      dotenv: mockDotENVPath,
      payload$: mockModulePath,
      'payload-config': payloadConfig.paths.rawConfig,
      'payload-user-css': payloadConfig.admin.css,
    },
    // Add support for TypeScripts fully qualified ESM imports.
    extensionAlias: {
      '.cjs': ['.cjs', '.cts'],
      '.js': ['.js', '.ts'],
      '.mjs': ['.mjs', '.mts'],
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    fallback: {
      crypto: false,
      http: false,
      https: false,
      path: require.resolve('path-browserify'),
    },
    modules: ['node_modules', path.resolve(_dirname, nodeModulesPath)],
  },
  resolveLoader: {
    modules: ['node_modules', path.join(_dirname, nodeModulesPath)],
  },
})
