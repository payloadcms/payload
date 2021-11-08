/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');

module.exports = [
  {
    devtool: 'source-map',
    mode: 'production',
    entry: './demo/index.tsx',
    output: {
      filename: 'demo.bundle.js',
      path: path.resolve(__dirname, 'dist-demo'),
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: [{
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.demo.json',
            },
          }],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    plugins: [
      new HtmlWebPackPlugin({
        template: 'demo/index.html',
      }),
    ],
  },
];
