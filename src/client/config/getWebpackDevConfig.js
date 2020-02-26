const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const getStyleLoaders = require('./getStyleLoaders');

module.exports = (config) => {
  return {
    entry: {
      main: [path.resolve(__dirname, '../../../node_modules/webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000'), path.resolve(__dirname, '../components/index.js')],
    },
    output: {
      path: '/',
      publicPath: '/static',
      filename: '[name].js',
    },
    devServer: {
      historyApiFallback: true,
    },
    devtool: 'source-map',
    mode: 'development',
    resolveLoader: { modules: [path.join(__dirname, '../../../node_modules')] },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  require.resolve('@babel/preset-env'),
                  {
                    modules: 'commonjs',
                  },
                ],
                require.resolve('@babel/preset-react'),
              ],
              plugins: [
                require.resolve('@babel/plugin-proposal-class-properties'),
                require.resolve('babel-plugin-add-module-exports'),
                [
                  require.resolve('@babel/plugin-transform-runtime'),
                  {
                    regenerator: true,
                  },
                ],
              ],
            },
          },
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve('url-loader'),
              options: {
                limit: 10000,
                name: 'static/media/[name].[hash:8].[ext]',
              },
            },
            // Opt-in support for SASS (using .scss or .sass extensions).
            // Chains the sass-loader with the css-loader and the style-loader
            // to immediately apply all styles to the DOM.
            {
              test: /\.(scss|sass)$/,
              use: getStyleLoaders({ importLoaders: 2 }, 'sass-loader'),
            },
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
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
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, '../index.html'),
        filename: './index.html',
      }),
      new webpack.HotModuleReplacementPlugin(),
    ],
    resolve: {
      modules: [path.resolve(__dirname, '../../../node_modules')],
      alias: {
        'payload-scss-overrides': config.paths.scssOverrides,
        'payload-custom-components': config.paths.components,
        'payload-config': config.paths.config,
        'payload-scss': path.resolve(__dirname, '../scss'),
      },
    },
  };
};
