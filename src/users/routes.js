const express = require('express');
const bindModelMiddleware = require('../express/middleware/bindModel');
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
} = require('./requestHandlers');

const {
  find,
  findByID,
  deleteHandler,
} = require('../collections/requestHandlers');

const router = express.Router();

const authRoutes = (User, config, email) => {
  router.all('*',
    bindModelMiddleware(User),
    bindCollectionMiddleware(config.user));

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
    .post(me);

  router
    .route('/first-register')
    .post(registerFirstUser);

  router
    .route('/forgot-password')
    .post(forgotPassword(config, email));

  router
    .route('/reset-password')
    .post(resetPassword);

  router
    .route(`/${config.user.slug}/register`)
    .post(register);

  router
    .route(`/${config.user.slug}`)
    .get(find);

  router.route(`/${config.user.slug}/:id`)
    .get(findByID)
    .put(update)
    .delete(deleteHandler);

  return router;
};

module.exports = authRoutes;
