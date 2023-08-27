import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack, { Configuration } from 'webpack';
import type { SanitizedConfig } from '../../../config/types.js';
import { fileURLToPath } from 'url';
import path, { dirname, join, parse, resolve } from 'path';
import { createRequire } from 'node:module';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

const mockModulePath = path.resolve(_dirname, '../../mocks/emptyModule.js');
const mockDotENVPath = path.resolve(_dirname, '../../mocks/dotENV.js');

const nodeModulesPath = path.resolve(_dirname, '../../../../node_modules');
const nodeModulesPath2 = path.resolve(_dirname, '../../../../../../node_modules');
const adminFolderPath = path.resolve(_dirname, '../../../admin');
const bundlerPath = path.resolve(_dirname, '../bundler.ts');
const bundlerPath2 = path.resolve(_dirname, '../bundler.js');


const require = createRequire(import.meta.url);


export const getBaseConfig = (payloadConfig: SanitizedConfig): Configuration => ({
  entry: {
    main: [
      adminFolderPath,
    ],
  },
  resolveLoader: {
    modules: ['node_modules', path.join(_dirname, nodeModulesPath),],
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: /\/node_modules\/(?!.+\.tsx?$).*$/,
        resolve: {
          fullySpecified: false,
        },
        use: [
          {
            loader: require.resolve('swc-loader'),
            options: {
              jsc: {
                parser: {
                  syntax: 'typescript',
                  tsx: true,
                },
                target: "esnext"
              },
              module: {
                type: "es6"
              }
            },
          },
        ],
      },
      {
        oneOf: [
          {
            test: /\.(?:ico|gif|png|jpg|jpeg|woff(2)?|eot|ttf|otf|svg)$/i,
            type: 'asset/resource',
          },
        ],
      },
    ],
  },
  resolve: {
    fallback: {
      path: require.resolve('path-browserify'),
      crypto: false,
      https: false,
      http: false,
    },
    modules: ['node_modules', path.resolve(_dirname, nodeModulesPath)],
    alias: {
      'payload-config': payloadConfig.paths.rawConfig,
      payload$: mockModulePath,
      'payload-user-css': payloadConfig.admin.css,
      dotenv: mockDotENVPath,
      [bundlerPath]: mockModulePath,
      [bundlerPath2]: mockModulePath,
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    // Add support for TypeScripts fully qualified ESM imports.
    extensionAlias: {
      ".js": [".js", ".ts"],
      ".cjs": [".cjs", ".cts"],
      ".mjs": [".mjs", ".mts"]
    }
  },
  plugins: [
    new webpack.ProvidePlugin(
      { process: require.resolve('process/browser') },
    ),
    new webpack.DefinePlugin(
      Object.entries(process.env).reduce(
        (values, [key, val]) => {
          if (key.indexOf('PAYLOAD_PUBLIC_') === 0) {
            return ({
              ...values,
              [`process.env.${key}`]: `'${val}'`,
            });
          }

          return values;
        },
        {},
      ),
    ),
    new HtmlWebpackPlugin({
      template: payloadConfig.admin.indexHTML,
      filename: path.normalize('./index.html'),
    }),
    new webpack.HotModuleReplacementPlugin(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    new webpack.NormalModuleReplacementPlugin(/\.js$/, function (
      /** @type {{ context: string, request: string }} */
      resource
    ) {
      // Skip a non relative import (e.g. a bare import specifier).
      if (resource.request.startsWith(".")) {
        const path = resolve(resource.context, resource.request);

        if (
          // Skip the relative import if it reaches into `node_modules`.
          !path.includes("node_modules") &&
          !existsSync(path)
        ) {
          const { dir, name } = parse(path);
          const extensionlessPath = join(dir, name);

          for (const fallbackExtension of [".tsx", ".ts", ".js"]) {
            if (existsSync(extensionlessPath + fallbackExtension)) {
              resource.request = resource.request.replace(
                /\.js$/,
                fallbackExtension
              );
              break;
            }
          }
        }
      }
    })
  ],
});
