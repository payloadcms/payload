const express = require('express');
const bindCollectionMiddleware = require('../collections/bindCollection');

const {
  init,
  login,
  logout,
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

const authRoutes = (collection, config, sendEmail) => {
  const { slug } = collection.config;

  router.all('*',
    bindCollectionMiddleware(collection));

  router
    .route(`/${slug}/init`)
    .get(init);

  router
    .route(`/${slug}/login`)
    .post(login(config));

  router
    .route(`/${slug}/logout`)
    .get(logout(config));

  router
    .route(`/${slug}/refresh-token`)
    .post(refresh(config));

  router
    .route(`/${slug}/me`)
    .get(me(config));

  router
    .route(`/${slug}/first-register`)
    .post(registerFirstUser(config));

  router
    .route(`/${slug}/forgot-password`)
    .post(forgotPassword(config, sendEmail));

  router
    .route(`${slug}/reset-password`)
    .post(resetPassword);

  router
    .route(`/${slug}/register`)
    .post(register(config));

  router
    .route(`/${slug}`)
    .get(find);

  router.route(`/${slug}/:id`)
    .get(findByID)
    .put(update)
    .delete(deleteHandler);

  return router;
};

module.exports = authRoutes;
