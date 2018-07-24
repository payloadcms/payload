const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.config');
const optConfig = require('./webpack.opt.config');

const demoConfig = {
  entry: './demo/index.js'
};

module.exports = merge.smart(baseConfig, optConfig, demoConfig);
