import OptimizeCSSAssetsPlugin from 'css-minimizer-webpack-plugin'
import MiniCSSExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'
import { fileURLToPath } from 'url'
import webpack from 'webpack'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** @type {import('webpack').Configuration} */
const componentWebpackConfig = {
  entry: path.resolve(dirname, './src/webpackEntry.ts'),
  externals: [
    'react',
    'react-dom',
    'payload',
    'react-image-crop',
    'payload/shared',
    'payload/server',
  ],
  mode: 'production',
  module: {
    rules: [
      {
        oneOf: [
          {
            // exclude: /node_modules/,
            test: /\.(t|j)sx?$/,
            use: [
              {
                loader: 'swc-loader',
                options: {
                  jsc: {
                    experimental: {
                      plugins: [
                        // clear the plugins used in .swcrc
                      ],
                    },
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
            sideEffects: true,
            test: /\.(scss|css)$/,
            use: [
              MiniCSSExtractPlugin.loader,
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: ['postcss-preset-env'],
                  },
                },
              },
              'sass-loader',
            ],
          },
          {
            type: 'asset/resource',
            generator: {
              filename: 'payload/[name][ext]',
            },
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/, /\.woff$/, /\.woff2$/],
          },
        ],
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
    libraryTarget: 'commonjs2',
    path: path.resolve(dirname, './dist/prod'),
    publicPath: '/',
  },
  plugins: [
    new MiniCSSExtractPlugin({
      filename: 'styles.css',
      ignoreOrder: true,
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  resolve: {
    extensionAlias: {
      '.js': ['.ts', '.tsx', '.js', '.scss', '.css'],
      '.mjs': ['.mts', '.mjs'],
    },
    extensions: ['.js', '.ts', '.tsx', '.scss', '.css'],
    modules: [
      'node_modules',
      path.resolve(dirname, '../../node_modules'),
      path.resolve(dirname, './node_modules'),
    ],
  },
  stats: 'errors-only',
}

export default componentWebpackConfig
