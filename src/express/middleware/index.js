const express = require('express');
const passport = require('passport');
const compression = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const qsMiddleware = require('qs-middleware');
const fileUpload = require('express-fileupload');
const localizationMiddleware = require('../../localization/middleware');
const authenticate = require('./authenticate');
const identifyAPI = require('./identifyAPI');

const middleware = (config) => {
  return [
    passport.initialize(),
    authenticate(config),
    express.json(),
    methodOverride('X-HTTP-Method-Override'),
    qsMiddleware({ depth: 10 }),
    bodyParser.urlencoded({ extended: true }),
    compression(config.compression),
    localizationMiddleware(config.localization),
    identifyAPI('REST'),
    fileUpload({
      parseNested: true,
    }),
    (req, res, next) => {
      if (config.cors) {
        if (config.cors.indexOf(req.headers.origin) > -1) {
          res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
          res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
        }

        res.header('Access-Control-Allow-Headers',
          'Origin X-Requested-With, Content-Type, Accept, Authorization');
      }

      next();
    },
  ];
};

module.exports = middleware;
