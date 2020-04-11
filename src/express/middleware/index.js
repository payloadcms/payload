const express = require('express');
const passport = require('passport');
const compression = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const localizationMiddleware = require('../../localization/middleware');

const middleware = (config) => {
  return [
    passport.initialize(),
    passport.session(),
    express.json(),
    cookieParser(),
    methodOverride('X-HTTP-Method-Override'),
    express.urlencoded({ extended: true }),
    bodyParser.urlencoded({ extended: true }),
    compression(config.compression),
    localizationMiddleware(config.localization),
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
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
