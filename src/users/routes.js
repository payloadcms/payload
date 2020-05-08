const express = require('express');
const bindCollectionMiddleware = require('../collections/bindCollection');

const {
  init,
  login,
  refresh,
  me,
  register,
  registerFirstUser,
  forgotPassword,
  resetPassword,
  update,
  policies,
} = require('./requestHandlers');

const {
  find,
  findByID,
  deleteHandler,
} = require('../collections/requestHandlers');

const router = express.Router();

const authRoutes = (User, config, sendEmail) => {
  router.all('*',
    bindCollectionMiddleware(User));

  router
    .route('/init')
    .get(init);

  router
    .route('/login')
    .post(login);

  router
    .route('/refresh-token')
    .post(refresh);

  router
    .route('/me')
    .get(me);

  router
    .route('/policies')
    .get(policies(config));

  router
    .route('/first-register')
    .post(registerFirstUser);

  router
    .route('/forgot-password')
    .post(forgotPassword(config, sendEmail));

  router
    .route('/reset-password')
    .post(resetPassword);

  router
    .route(`/${User.config.slug}/register`)
    .post(register);

  router
    .route(`/${User.config.slug}`)
    .get(find);

  router.route(`/${User.config.slug}/:id`)
    .get(findByID)
    .put(update)
    .delete(deleteHandler);

  return router;
};

module.exports = authRoutes;
