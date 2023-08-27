import path, { dirname } from 'path';
import MiniCSSExtractPlugin from 'mini-css-extract-plugin';
import TerserJSPlugin from 'terser-webpack-plugin';
import terser from 'terser'; // IMPORTANT - DO NOT REMOVE: This is required for pnpm's default isolated mode to work - even though the import is not used. This is due to a typescript bug: https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1519138189. (tsbugisolatedmode)
import OptimizeCSSAssetsPlugin from 'css-minimizer-webpack-plugin';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);
const require = createRequire(import.meta.url);

export default {
  entry: {
    main: [path.resolve(_dirname, '../../admin/components/index.js')],
  },
  externals: {
    react: 'react',
  },
  output: {
    path: path.resolve(_dirname, '../../exports/components'),
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
        test: /\.(t|j)sx?$/,
        exclude: /node_modules/,
        resolve: {
          fullySpecified: false
        },
        use: [
          {
            loader: require.resolve('swc-loader'),
          },
        ],
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
    mainFiles: ['index'],
    alias: {
      'payload-scss-overrides': path.resolve(_dirname, '../../admin/scss/overrides.scss'),
    },
    modules: ['node_modules', path.resolve(_dirname, '../../../node_modules')],
  },
};
