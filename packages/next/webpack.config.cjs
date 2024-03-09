/* eslint-disable @typescript-eslint/no-var-requires */
const OptimizeCSSAssetsPlugin = require('css-minimizer-webpack-plugin')
const MiniCSSExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const TerserJSPlugin = require('terser-webpack-plugin')

const componentWebpackConfig = {
  entry: path.resolve(__dirname, './src/index.ts'),
  externals: ['react', 'react-dom', /^payload.*/, /^next.*/, 'react-image-crop'],
  // externalsType: 'commonjs',
  mode: 'production',
  module: {
    rules: [
      {
        // exclude: /node_modules/,
        test: /\.(t|j)sx?$/,
        use: [
          // {
          //   loader: 'swc-loader',
          //   options: {
          //     jsc: {
          //       parser: {
          //         dts: true,
          //         syntax: 'typescript',
          //         tsx: true,
          //       },
          //     },
          //     module: {
          //       type: 'es6',
          //     },
          //   },
          // },
          {
            loader: '@swc-node/loader',
            options: {
              // compilerOptions: {
              //   esModuleInterop: true,
              //   jsx: true,
              //   module: 'esnext',
              //   moduleResolution: 'NodeNext',
              //   target: 'ES5',
              //   sourceMap: false,
              // },
              include: ['../**/*.ts', '../**/*.tsx'],
              // absolute path for tsconfig.json
              configFile: path.join(__dirname, '../../tsconfig.json'),
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
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    modules: ['node_modules', path.resolve(__dirname, '../../node_modules')],
  },
  stats: 'errors-only',
}

module.exports = componentWebpackConfig
