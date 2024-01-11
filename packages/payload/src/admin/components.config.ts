import type { Configuration } from 'webpack'

import OptimizeCSSAssetsPlugin from 'css-minimizer-webpack-plugin'
import MiniCSSExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import TerserJSPlugin from 'terser-webpack-plugin'

const componentWebpackConfig: Configuration = {
  entry: {
    main: [path.resolve(__dirname, './components/index.js')],
  },
  externals: {
    react: 'react',
  },
  mode: 'production',
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(t|j)sx?$/,
        use: [
          {
            loader: require.resolve('swc-loader'),
          },
        ],
      },
      {
        oneOf: [
          {
            loader: require.resolve('url-loader'),
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
              limit: 10000,
            },
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          },
          {
            sideEffects: true,
            test: /\.(sa|sc|c)ss$/,
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
            exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
            loader: require.resolve('file-loader'),
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
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
    path: path.resolve(__dirname, '../../components'),
    publicPath: '/',
  },
  plugins: [
    new MiniCSSExtractPlugin({
      filename: 'styles.css',
      ignoreOrder: true,
    }),
  ],
  resolve: {
    alias: {
      'payload-scss-overrides': path.resolve(__dirname, './scss/overrides.scss'),
    },
    modules: ['node_modules', path.resolve(__dirname, '../../node_modules')],
  },
  stats: 'errors-only',
}

export default componentWebpackConfig
