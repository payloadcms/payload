
import webpack from 'webpack';
import express from 'express';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { getWebpackDevConfig } from './getDevConfig';
import { PayloadBundler } from '../types';
import { getWebpackProdConfig } from './getProdConfig';

export const getWebpackBundler = (): PayloadBundler => ({
  dev: async (sanitizedConfig) => {
    const router = express.Router();

    const webpackDevConfig = getWebpackDevConfig(sanitizedConfig);

    const compiler = webpack(webpackDevConfig);

    router.use(webpackDevMiddleware(compiler, {
      publicPath: webpackDevConfig.output.publicPath as string,
    }));

    router.use(webpackHotMiddleware(compiler));

    return router;
  },
  build: async (sanitizedConfig) => {
    try {
      const webpackProdConfig = getWebpackProdConfig(sanitizedConfig);

      webpack(webpackProdConfig, (err, stats) => { // Stats Object
        if (err || stats.hasErrors()) {
          // Handle errors here

          if (stats) {
            console.error(stats.toString({
              chunks: false,
              colors: true,
            }));
          } else {
            console.error(err.message);
          }
        }
      });
    } catch (err) {
      console.error(err);
      throw new Error('Error: there was an error building the webpack config.');
    }
  },
  serve: async (sanitizedConfig) => {
    // serve built files in production
  },
});
