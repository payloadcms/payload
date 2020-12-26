import webpack from 'webpack';
import express, { Router } from 'express';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import getWebpackDevConfig from './getWebpackDevConfig';
import { Config } from '../config/types';

const router = express.Router();

function initWebpack(config: Config): Router {
  const webpackDevConfig = getWebpackDevConfig(config);
  const compiler = webpack(webpackDevConfig);

  router.use(webpackDevMiddleware(compiler, {
    publicPath: webpackDevConfig.output.publicPath as string,
  }));

  router.use(webpackHotMiddleware(compiler));

  return router;
}

export default initWebpack;
