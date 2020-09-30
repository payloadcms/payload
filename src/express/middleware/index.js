const express = require('express');
const passport = require('passport');
const compression = require('compression');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const qsMiddleware = require('qs-middleware');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');
const localizationMiddleware = require('../../localization/middleware');
const authenticate = require('./authenticate');
const identifyAPI = require('./identifyAPI');

const middleware = (payload) => [
  rateLimit({
    windowMs: payload.config.rateLimit.window,
    max: payload.config.rateLimit.max,
    skip(req) {
      return payload.config.rateLimit.whitelist.includes(req.ip);
    },
  }),
  passport.initialize(),
  identifyAPI('REST'),
  authenticate(payload.config),
  express.json(),
  methodOverride('X-HTTP-Method-Override'),
  qsMiddleware({ depth: 10 }),
  bodyParser.urlencoded({ extended: true }),
  compression(payload.config.compression),
  localizationMiddleware(payload.config.localization),
  fileUpload({
    parseNested: true,
  }),
  (req, _, next) => {
    req.payload = payload;
    next();
  },
  (req, res, next) => {
    if (payload.config.cors) {
      res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

      if (payload.config.cors === '*') {
        res.setHeader('Access-Control-Allow-Origin', '*');
      } else if (Array.isArray(payload.config.cors) && payload.config.cors.indexOf(req.headers.origin) > -1) {
        res.header('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      }
    }

    next();
  },
  ...(payload.config.middleware || []),
];

module.exports = middleware;
