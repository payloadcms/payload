const express = require('express');

const {
  init,
  login,
  refresh,
  me,
  register,
  registerFirstUser,
  forgotPassword,
  resetPassword,
} = require('./requestHandlers');

const router = express.Router();

const authRoutes = (User, config, email) => {
  router
    .route('/init')
    .get(init(User));

  router
    .route('/login')
    .post(login(User, config.user));

  router
    .route('/refresh')
    .post(refresh(config.user));

  router
    .route('/me')
    .post(me);

  router
    .route(`/${config.user.slug}/register`)
    .post(register(User, config.user));

  router
    .route('/first-register')
    .post(registerFirstUser(User, config.user));

  router
    .route('/forgot')
    .post(forgotPassword(User, config, email));

  router
    .route('/reset')
    .post(resetPassword(User));

  return router;
};

module.exports = authRoutes;
