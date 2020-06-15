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

  router.get(`${this.config.routes.admin}*`, (req, res, next) => {
    compiler.outputFileSystem.readFile('/index.html', (err, result) => {
      if (err) {
        return next(err);
      }
      return res.set('content-type', 'text/html').send(result);
    });
  });

  return router;
}

module.exports = initWebpack;
