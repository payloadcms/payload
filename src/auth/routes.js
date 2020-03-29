const express = require('express');
const passport = require('passport');
const httpStatus = require('http-status');
const APIError = require('../errors/APIError');
const authRequestHandlers = require('./requestHandlers');
const passwordResetRoutes = require('./passwordResets/routes');

const router = express.Router();
const authRoutes = (userConfig, User) => {
  const auth = authRequestHandlers(userConfig, User);

  router
    .route('/login')
    .post(auth.login);

  router
    .route('/refresh')
    .post(auth.refresh);

  router
    .route('/me')
    .post(passport.authenticate(userConfig.auth.strategy, { session: false }), auth.me);

  if (userConfig.auth.passwordResets) {
    router.use('', passwordResetRoutes(userConfig.email, User));
  }

  if (userConfig.auth.registration) {
    router
      .route(`${userConfig.slug}/register`) // TODO: not sure how to incorporate url params like `:pageId`
      .post(auth.register);

    router
      .route('/first-register')
      .post((req, res, next) => {
        User.countDocuments({}, (err, count) => {
          if (err) res.status(500).json({ error: err });
          if (count >= 1) return res.status(403).json({ initialized: true });
          return next();
        });
      }, (req, res, next) => {
        User.register(new User(req.body), req.body.password, (err) => {
          if (err) {
            const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
            return res.status(httpStatus.UNAUTHORIZED).json(error);
          }

          return next();
        });
      }, auth.login);
  }

  return router;
};

module.exports = authRoutes;
