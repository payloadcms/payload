const express = require('express');

const {
  init,
  login,
  refresh,
  me,
  register,
  checkIfInitialized,
  forgotPassword,
  resetPassword,
} = require('./requestHandlers');

const router = express.Router();

const authRoutes = (config, User) => {
  const registerHandler = register(User, config);

  router
    .route('/init')
    .get(init(User));

  router
    .route('/login')
    .post(login(User, config));

  router
    .route('/refresh')
    .post(refresh(config));

  router
    .route('/me')
    .post(me);

  router
    .route(`/${config.user.slug}/register`)
    .post(registerHandler);

  router
    .route('/first-register')
    .post(checkIfInitialized(User), registerHandler);

  router
    .route('/forgot')
    .post(forgotPassword(User, config));

  router
    .route('/reset')
    .post(resetPassword(User));

  return router;
};

module.exports = authRoutes;
