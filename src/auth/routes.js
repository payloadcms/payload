const express = require('express');
const passport = require('passport');
const authRequestHandlers = require('./requestHandlers');
const passwordResetRoutes = require('./passwordResets/routes');

const router = express.Router();

const authRoutes = (config, User) => {
  const auth = authRequestHandlers(config, User);

  router
    .route('/init')
    .get((req, res) => {
      User.countDocuments({}, (err, count) => {
        if (err) res.status(200).json({ error: err });
        return count >= 1
          ? res.status(200).json({ initialized: true })
          : res.status(200).json({ initialized: false });
      });
    });

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
