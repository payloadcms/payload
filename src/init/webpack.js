const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const path = require('path');
const getWebpackDevConfig = require('../client/config/getWebpackDevConfig');

const initWebpack = ({ config, app }) => {
  const webpackDevConfig = getWebpackDevConfig(config);
  const compiler = webpack(webpackDevConfig);

  app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackDevConfig.output.publicPath,
  }));

  app.use(webpackHotMiddleware(compiler));

  app.get(`${config.routes.admin}*`, (req, res, next) => {
    compiler.outputFileSystem.readFile('/index.html', (err, result) => {
      if (err) {
        return next(err);
      }
      res.set('content-type', 'text/html');
      res.send(result);
      res.end();
    });
  });
};

module.exports = initWebpack;
