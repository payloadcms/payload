import OptimizeCSSAssetsPlugin from 'css-minimizer-webpack-plugin'
import MiniCSSExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'
import { fileURLToPath } from 'url'
import webpack from 'webpack'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const componentWebpackConfig = {
  entry: {
    server: path.resolve(dirname, './src/exports/server/index.ts'),
    client: path.resolve(dirname, './src/exports/client/index.ts'),
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
            // exclude: /node_modules/,
            test: /\.(t|j)sx?$/,
            use: [
              {
                loader: 'swc-loader',
                options: {
                  jsc: {
                    experimental: {
                      plugins: [
                        [
                          'swc-plugin-transform-remove-imports',
                          {
                            test: '\\.(scss|css)$',
                          },
                        ],
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
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: path.resolve(dirname, './dist'),
    publicPath: '/',
  },
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
