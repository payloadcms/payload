import OptimizeCSSAssetsPlugin from 'css-minimizer-webpack-plugin'
import MiniCSSExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'
import { fileURLToPath } from 'url'
import webpack from 'webpack'
import fs from 'fs-extra'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const componentWebpackConfig = {
  entry: {
    main: [
      path.resolve(dirname, './src/exports/server/index.ts'),
      path.resolve(dirname, './src/exports/client/index.ts'),
    ],
  },
  externals: [
    'react',
    'react-dom',
    'payload',
    'payload/config',
    'react-image-crop',
    'payload/operations',
  ],
  mode: 'production',
  module: {
    rules: [
      {
        oneOf: [
          {
            test: /\.(t|j)sx?$/,
            use: [
              {
                loader: 'swc-loader',
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
  plugins: [
    new MiniCSSExtractPlugin({
      filename: 'styles.css',
      ignoreOrder: true,
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    {
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
          fs.removeSync('./dist/main.js')
        })
      },
    },
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
