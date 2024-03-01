const OptimizeCSSAssetsPlugin = require('css-minimizer-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const TerserJSPlugin = require('terser-webpack-plugin')

const componentWebpackConfig = {
  entry: path.resolve(__dirname, './src/index.ts'),
  externals: ['react', 'react-dom', /^payload.*/, /^next.*/, 'react-image-crop'],
  externalsType: 'commonjs',
  mode: 'production',
  module: {
    rules: [
      {
        // exclude: /node_modules/,
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
        loader: require.resolve('url-loader'),
        options: {
          name: 'static/[name].[hash:8].[ext]',
          limit: 10000,
        },
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.woff$/, /\.woff2$/, /\.svg$/],
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
    path: path.resolve(__dirname, './dist'),
    publicPath: '/',
  },
  plugins: [
    new MiniCSSExtractPlugin({
      filename: 'styles.css',
      ignoreOrder: true,
    }),
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    modules: ['node_modules', path.resolve(__dirname, '../../node_modules')],
  },
  stats: 'errors-only',
}

module.exports = componentWebpackConfig
