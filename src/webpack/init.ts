import webpack from 'webpack';
import express from 'express';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import getWebpackDevConfig from './getWebpackDevConfig';

const router = express.Router();

function initWebpack() {
  const webpackDevConfig = getWebpackDevConfig(this.config);
  const compiler = webpack(webpackDevConfig);

  router.use(webpackDevMiddleware(compiler, {
    publicPath: webpackDevConfig.output.publicPath,
    stats: 'errors-only',
  }));

  router.use(webpackHotMiddleware(compiler));

  return router;
}

module.exports = initWebpack;
