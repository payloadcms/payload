/* eslint-disable @typescript-eslint/no-var-requires */

import OptimizeCSSAssetsPlugin from 'css-minimizer-webpack-plugin'
import MiniCSSExtractPlugin from 'mini-css-extract-plugin'
import path, { join, parse, resolve } from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'
import { fileURLToPath } from 'url'
import webpack from 'webpack'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
import { existsSync } from 'fs'

const exportsFolderPath = path.resolve(dirname, './packages/ui/src/exports')
const exportsFolderPath2 = path.resolve(dirname, './packages/ui/src/assets')

const mockModulePath = path.resolve(dirname, './emptyModule.js')


/** @type {import('webpack').Configuration}*/
const componentWebpackConfig = {
  entry: path.resolve(dirname, './packages/next/src/index.ts'),
  externals: ['react', 'react-dom', /^payload.*/, /^next.*/, 'react-image-crop'],
  //externalsType: 'commonjs',
  mode: 'production',
  module: {
    rules: [
      {
        exclude: function(modulePath) {
          // Check if the modulePath is within node_modules and does not end with .tsx or .ts
          const isNodeModuleButNotTS = /node_modules/.test(modulePath)

          // Check if the modulePath starts with ./packages/payload
          const isPayloadPackage = /packages\/payload/.test(modulePath.replace(/\\/g, '/')); // Normalizing backslashes to forward slashes to handle Windows paths

          // Exclude if either condition is true
          return isNodeModuleButNotTS || isPayloadPackage
        },
        resolve: {
          fullySpecified: false,
        },
        // exclude: /node_modules/,
        test: /\.(t|j)sx?$/,
        use: [
          {
            loader: '@swc-node/loader',
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
              // absolute path for tsconfig.json
              configFile: path.join(dirname, 'tsconfig.json'),
            },
          },
        ],
      },

      {

        sideEffects: true,
        test: /\.(scss|css)$/,
        use: [
          {
            loader: MiniCSSExtractPlugin.loader,
            options: {
              esModule: true,
            }
          } ,
          {
            loader: require.resolve('css-loader'),
            options: {
              esModule: true,
              //url: false
              /* // TODO: Enable url resolving again
              url: {
                filter: (url, resourcePath) => !url.startsWith('/'),
              },
               */
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
          {
            loader: require.resolve('sass-loader'),
            options: {
              sassOptions: {
                includePaths: [exportsFolderPath, exportsFolderPath2],
              },
            },
          },
        ],
      },
      {
        test: /\.(ttf|woff|woff2)$/,
        type: 'asset/resource',
        exclude: '/node_modules/',
        generator: {
          filename: 'fonts/[name].[ext]',
        }
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|eot|otf|svg)$/i,
        type: 'asset/resource',
        exclude: '/node_modules/',
      },

      {
        exclude: function(modulePath) {
          // Check if the modulePath starts with ./packages/payload
          const isPayloadPackage = /packages\/payload/.test(modulePath.replace(/\\/g, '/')); // Normalizing backslashes to forward slashes to handle Windows paths

          // Exclude if either condition is true
          return !isPayloadPackage
        },
        test: /\.(t|j)sx?$/,
        type: 'asset/resource',
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserJSPlugin({
        extractComments: false,
      }),
      new OptimizeCSSAssetsPlugin({}),
    ],
  },
  output: {
    filename: 'index.js',
    //libraryTarget: 'commonjs2',
    path: path.resolve(dirname, './dist'),
    publicPath: '/',
  },
  plugins: [
    new MiniCSSExtractPlugin({
      filename: 'styles.css',
      ignoreOrder: true,
    }),
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
    fullySpecified: false,
    extensionAlias: {
      '.cjs': ['.cjs', '.cts'],
      '.js': ['.js', '.ts'], // TODO: instead of my webpack.NormalModuleReplacementPlugin I could also add .tsx and .jsx here
      '.mjs': ['.mjs', '.mts'],
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      payload$: mockModulePath,
    },
    fallback: {
      crypto: false,
      http: false,
      https: false,
      path: require.resolve('path-browserify'),
    },
    modules: ['node_modules', path.join(dirname, './node_modules')],
  },
  resolveLoader: {
    modules: ['node_modules',  path.join(dirname, './node_modules')],
  },
  stats: 'errors-only',
}

export default componentWebpackConfig
