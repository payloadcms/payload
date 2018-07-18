let webpack = require('webpack');
let merge = require('webpack-merge');
let baseConfig = require('./webpack.base.config');
let optConfig = require('./webpack.opt.config');

function prodConfig(env) {
  const NODE_ENV = env.NODE_ENV ? env.NODE_ENV : 'development';

  return {
    plugins: [
      new webpack.DefinePlugin({ 'process.env.NODE_ENV': JSON.stringify(NODE_ENV) })
    ]
  };
}

module.exports = merge.smart(baseConfig, optConfig, prodConfig);
