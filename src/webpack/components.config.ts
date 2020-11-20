const path = require('path');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const babelConfig = require('../../babel.config');

module.exports = {
  entry: {
    main: [path.resolve(__dirname, '../admin/components/index.js')],
  },
  externals: {
    react: 'react',
  },
  output: {
    path: path.resolve(__dirname, '../../components'),
    publicPath: '/',
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
  optimization: {
    minimizer: [new TerserJSPlugin({
      extractComments: false,
    }), new OptimizeCSSAssetsPlugin({})],
  },
  mode: 'production',
  stats: 'errors-only',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: babelConfig,
        },
      },
      {
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          {
            test: /\.(sa|sc|c)ss$/,
            sideEffects: true,
            use: [
              MiniCSSExtractPlugin.loader,
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: [
                      'postcss-preset-env',
                    ],
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
  plugins: [
    new MiniCSSExtractPlugin({
      filename: 'styles.css',
      ignoreOrder: true,
    }),
  ],
  resolve: {
    alias: {
      'payload-scss-overrides': path.resolve(__dirname, '../admin/scss/overrides.scss'),
    },
    modules: ['node_modules', path.resolve(__dirname, '../../node_modules')],
  },
};
