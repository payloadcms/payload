const webpack = require('webpack');
const express = require('express');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const getWebpackDevConfig = require('./getWebpackDevConfig');

const router = express.Router();

function initWebpack() {
  const webpackDevConfig = getWebpackDevConfig(this.config);
  const compiler = webpack(webpackDevConfig);

  router.use(webpackDevMiddleware(compiler, {
    publicPath: webpackDevConfig.output.publicPath,
  }));

  router.use(webpackHotMiddleware(compiler));

  return router;
}

module.exports = initWebpack;
