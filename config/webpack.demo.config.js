const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = require('./webpack.base.config');
const optConfig = require('./webpack.opt.config');

const demoConfig = {
  entry: './demo/client/index.js',
  plugins: [
    new HtmlWebpackPlugin({
      template: './demo/client/index.html',
      filename: './index.html'
    })
  ]
};

// Instead of simply merging the base and demo configs,
// we need to replace the plugisn array entirely
// as local development will feature a different index.html entry point
module.exports = merge.strategy({ 
  plugins: 'replace'
})(baseConfig, optConfig, demoConfig);