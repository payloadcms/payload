const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const localizationMiddleware = require('../localization/middleware');

const registerExpressMiddleware = (app, config, router) => {
  app.use(express.json());
  app.use(methodOverride('X-HTTP-Method-Override'));
  app.use(express.urlencoded({ extended: true }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(compression(config.compression));
  app.use(localizationMiddleware(config.localization));
  app.use(router);
};

module.exports = registerExpressMiddleware;
