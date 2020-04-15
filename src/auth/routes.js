const express = require('express');
const passwordResetRoutes = require('./passwordResets/routes');

const {
  init,
  login,
  refresh,
  me,
  register,
  checkIfInitialized,
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

  router.use('', passwordResetRoutes(config.email, User));

  router
    .route(`/${config.user.slug}/register`)
    .post(registerHandler);

  router
    .route('/first-register')
    .post(checkIfInitialized(User), registerHandler);

  return router;
};

module.exports = authRoutes;
