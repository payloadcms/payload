const express = require('express');
const passport = require('passport');
const authRequestHandlers = require('./requestHandlers');
const passwordResetRoutes = require('./passwordResets/routes');

const router = express.Router();
const authRoutes = (config, User) => {
  const auth = authRequestHandlers(config, User);

  router
    .route('/login')
    .post(auth.login);

  router
    .route('/refresh')
    .post(auth.refresh);

  router
    .route('/me')
    .post(passport.authenticate('jwt', { session: false }), auth.me);

  router.use('', passwordResetRoutes(config.email, User));

  router
    .route(`${config.user.slug}/register`)
    .post(auth.register);

  router
    .route('/first-register')
    .post(auth.checkForExistingUsers, auth.register);

  return router;
};

module.exports = authRoutes;
